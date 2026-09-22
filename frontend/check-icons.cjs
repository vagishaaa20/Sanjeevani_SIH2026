const lucide = require('lucide-react');

const check = (name) => {
  if (!lucide[name]) {
    console.error('MISSING ICON: ' + name);
  }
}

check('ArrowDown');
check('Files');
check('Building');
check('RotateCcw');
check('Clock');
check('Target');
check('AlertTriangle');
check('User');
check('Activity');
check('Bot');
check('Building2');
check('Stethoscope');
check('FileSearch');
check('CheckCircle2');
check('ChevronRight');
check('MapPin');
check('Pill');
check('ShieldCheck');
check('FileCheck');
check('Calendar');
check('WifiOff');
check('Wifi');
check('CloudUpload');
check('CheckCircle');
check('Database');
check('Globe');
check('MessageSquare');
check('ArrowRight');
check('Layers');

console.log('Done checking icons.');
