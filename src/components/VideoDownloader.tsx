import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download, Youtube } from 'lucide-react';
import VideoInfo from './VideoInfo';
import QualitySelector from './QualitySelector';

export interface VideoFormat {
  format_id: string;
  ext: string;
  resolution: string;
  filesize: number;
  format_note: string;
}

export interface VideoDetails {
  title: string;
  duration: string;
  views: number;
  thumbnail: string;
  formats: VideoFormat[];
}

const VideoDownloader = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const { toast } = useToast();

  const fetchVideoInfo = async () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/video-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error('Failed to fetch video info');

      const data = await response.json();
      setVideoDetails(data);
      console.log('Video details fetched:', data);
    } catch (error) {
      console.error('Error fetching video info:', error);
      toast({
        title: "Error",
        description: "Failed to fetch video information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = async () => {
    if (!selectedFormat) {
      toast({
        title: "Error",
        description: "Please select a format",
        variant: "destructive"
      });
      return;
    }

    setDownloading(true);
    setProgress(0);

    try {
      const response = await fetch('http://localhost:5000/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          format_id: selectedFormat,
        }),
      });

      if (!response.ok) throw new Error('Download failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to initialize download');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        try {
          const data = JSON.parse(text);
          if (data.progress) {
            setProgress(data.progress);
          }
        } catch (e) {
          console.log('Progress update:', text);
        }
      }

      toast({
        title: "Success",
        description: "Video downloaded successfully!",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Download failed",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="gradient-bg" />
      <Card className="max-w-2xl mx-auto p-6 backdrop-blur-sm bg-background/80">
        <div className="space-y-6 animate-in">
          <div className="flex flex-col items-center gap-2 text-center">
            <Youtube className="h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold">YouTube Downloader</h1>
            <p className="text-sm text-muted-foreground">
              Download YouTube videos in your preferred quality
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Enter YouTube URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={fetchVideoInfo}
              disabled={loading || !url}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Fetch Info"
              )}
            </Button>
          </div>

          {videoDetails && (
            <div className="space-y-4 animate-in">
              <VideoInfo details={videoDetails} />
              <QualitySelector
                formats={videoDetails.formats}
                selectedFormat={selectedFormat}
                onFormatSelect={setSelectedFormat}
              />
              
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={downloadVideo}
                  disabled={downloading || !selectedFormat}
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {downloading ? "Downloading..." : "Download"}
                </Button>
                
                {downloading && (
                  <div className="space-y-1 animate-in">
                    <Progress value={progress} />
                    <p className="text-sm text-center text-muted-foreground">
                      {progress.toFixed(1)}% Complete
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default VideoDownloader;