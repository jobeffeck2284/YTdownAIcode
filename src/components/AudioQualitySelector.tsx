import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

interface AudioFormat {
  format_id: string;
  ext: string;
  filesize: number;
  format_note: string;
  abr: number;
}

interface AudioQualitySelectorProps {
  formats: AudioFormat[];
  selectedFormat: string;
  onFormatSelect: (format: string) => void;
}

const AudioQualitySelector = ({
  formats,
  selectedFormat,
  onFormatSelect,
}: AudioQualitySelectorProps) => {
  const { t } = useLanguage();
  const sortedFormats = [...formats].sort((a, b) => {
    const aSize = a.filesize || 0;
    const bSize = b.filesize || 0;
    return bSize - aSize;
  });

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('selectAudioQuality')}</label>
      <Select value={selectedFormat} onValueChange={onFormatSelect}>
        <SelectTrigger>
          <SelectValue placeholder={t('selectAudioQuality')} />
        </SelectTrigger>
        <SelectContent>
          {sortedFormats.map((format) => (
            <SelectItem key={format.format_id} value={format.format_id}>
              {format.abr}kbps - {format.ext}
              {format.filesize && ` - ${(format.filesize / 1024 / 1024).toFixed(1)} MB`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AudioQualitySelector;