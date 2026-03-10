import { useSearchParams } from 'react-router-dom';
import PitchOverlay from '../components/PitchOverlay';

export default function PitchPage() {
  const [searchParams] = useSearchParams();
  const lat = parseFloat(searchParams.get('lat')) || 39.7684;
  const lng = parseFloat(searchParams.get('lng')) || -86.1581;

  const handlePitchSelected = (pitch) => {
    // Send pitch back to the main tab
    const bc = new BroadcastChannel('roof-pitch-channel');
    bc.postMessage({ type: 'pitch-selected', pitch });
    bc.close();
    // Close this tab
    window.close();
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <PitchOverlay
      center={[lat, lng]}
      onPitchSelected={handlePitchSelected}
      onClose={handleClose}
      standalone
    />
  );
}
