'use strict';

/**
 * blockchainService.js
 *
 * Wraps the deployed PrescriptionAnchor contract on Polygon Amoy.
 * - computeCanonicalHash(): deterministic sha256 of structured fields
 * - anchorOnChain():        sends anchor(bytes32) tx, returns txHash
 * - verifyOnChain():        calls verify(bytes32) view fn
 */

const crypto = require('crypto');
const { ethers } = require('ethers');
const abi = require('../config/prescriptionAnchorAbi.json');

// ── Lazy-init provider + contract ────────────────────────────────────────────
let _provider = null;
let _contract = null;

function getContract() {
    if (_contract) return _contract;

    const rpcUrl = process.env.AMOY_RPC_URL;
    const privateKey = process.env.BLOCKCHAIN_WALLET_PRIVATE_KEY;
    const contractAddress = process.env.PRESCRIPTION_ANCHOR_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
        throw new Error(
            'Blockchain env vars not configured: AMOY_RPC_URL, BLOCKCHAIN_WALLET_PRIVATE_KEY, PRESCRIPTION_ANCHOR_ADDRESS'
        );
    }

    _provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, _provider);
    _contract = new ethers.Contract(contractAddress, abi, wallet);
    return _contract;
}

/**
 * Compute a deterministic SHA-256 hash of the consultation's fields.
 * IMPORTANT: we hash the *field data*, not the raw PDF bytes.
 * PDF libraries embed non-deterministic metadata so hashing bytes would
 * break re-verification.
 *
 * @returns {string} '0x'-prefixed 32-byte hex hash suitable for bytes32
 */
function computeCanonicalHash(consultationId, doctorId, patientId, finalDiagnosis, prescriptionText, completedAt) {
    const canonical = [
        consultationId,
        doctorId,
        patientId,
        (finalDiagnosis || '').trim(),
        (prescriptionText || '').trim(),
        completedAt instanceof Date ? completedAt.toISOString() : String(completedAt),
    ].join('|');

    const hashHex = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
    return '0x' + hashHex;
}

/**
 * Anchor a hash on-chain via the PrescriptionAnchor contract.
 * Fire-and-forget — caller should not block on this.
 *
 * @param {string} hashHex  '0x'-prefixed hex string (32 bytes)
 * @returns {Promise<string>} transaction hash
 */
async function anchorOnChain(hashHex) {
    const contract = getContract();
    const bytes32Hash = ethers.zeroPadValue(hashHex, 32);

    // Use a reasonable gas limit + EIP-1559 fee settings for Amoy
    const feeData = await contract.runner.provider.getFeeData();
    const tx = await contract.anchor(bytes32Hash, {
        gasLimit: 100_000,
        maxFeePerGas: feeData.maxFeePerGas ?? ethers.parseUnits('30', 'gwei'),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? ethers.parseUnits('25', 'gwei'),
    });

    await tx.wait(1); // wait for 1 confirmation
    return tx.hash;
}

/**
 * Query on-chain whether a hash has been anchored.
 *
 * @param {string} hashHex  '0x'-prefixed hex string (32 bytes)
 * @returns {Promise<{ exists: boolean, anchoredBy: string, timestamp: number }>}
 */
async function verifyOnChain(hashHex) {
    const contract = getContract();
    const bytes32Hash = ethers.zeroPadValue(hashHex, 32);
    const [exists, anchoredBy, timestamp] = await contract.verify(bytes32Hash);
    return {
        exists,
        anchoredBy,
        timestamp: Number(timestamp), // BigInt → JS number (safe for unix ts)
    };
}

module.exports = { computeCanonicalHash, anchorOnChain, verifyOnChain };
