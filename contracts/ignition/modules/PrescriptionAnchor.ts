import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PrescriptionAnchorModule", (m) => {
  const prescriptionAnchor = m.contract("PrescriptionAnchor");
  return { prescriptionAnchor };
});