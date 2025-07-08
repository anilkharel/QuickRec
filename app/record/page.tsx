"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Download,
  ExternalLink,
  HardDrive,
  Mic,
  Monitor,
  Pause,
  Play,
  Settings,
  Square,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type RecordingState = "idle" | "recording" | "paused" | "stopped";

interface RecordingOptions {
  includeAudio: boolean;
  audioSource: "microphone" | "system" | "both";
  videoQuality: "720p" | "1080p" | "4k";
  frameRate: number;
}

export default function RecordPage() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingOptions, setRecordingOptions] = useState<RecordingOptions>({
    includeAudio: true,
    audioSource: "microphone",
    videoQuality: "1080p",
    frameRate: 30,
  });
  const [error, setError] = useState<string | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isInIframe, setIsInIframe] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setIsSupported(false);
      setError(
        "Screen recording is not supported in this browser. Please use Chrome, Firefox, or Edge."
      );
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setIsSupported(false);
      setError(
        "Screen recording requires HTTPS. Please access this page over a secure connection."
      );
      return;
    }

    if (!window.MediaRecorder) {
      setIsSupported(false);
      setError("Media recording is not supported in this browser.");
      return;
    }

    return () => {
      cleanupStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    };
  }, [recordedVideoUrl]);

  // Cleanup stream function
  const cleanupStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
      setStream(null);
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
  }, [stream]);

  const getVideoConstraints = useCallback((): MediaStreamConstraints => {
    const constraints: MediaStreamConstraints = {
      video: {
        frameRate: { ideal: recordingOptions.frameRate },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio:
        recordingOptions.includeAudio &&
        recordingOptions.audioSource !== "microphone",
    };

    switch (recordingOptions.videoQuality) {
      case "720p":
        constraints.video = {
          ...(typeof constraints.video === "object" &&
          constraints.video !== null
            ? constraints.video
            : {}),
          width: { ideal: 1280 },
          height: { ideal: 720 },
        };
        break;
      case "1080p":
        constraints.video = {
          ...(typeof constraints.video === "object" &&
          constraints.video !== null
            ? constraints.video
            : {}),
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        };
        break;
      case "4k":
        constraints.video = {
          ...(typeof constraints.video === "object" &&
          constraints.video !== null
            ? constraints.video
            : {}),
          width: { ideal: 3840 },
          height: { ideal: 2160 },
        };
        break;
    }

    return constraints;
  }, [recordingOptions]);

  const startDemo = useCallback(() => {
    setShowDemo(true);
    setRecordingState("recording");
    setRecordingTime(0);
    setError(null);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= 10) {
          stopDemo();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = 800;
        canvas.height = 450;

        let frame = 0;
        const animate = () => {
          if (recordingState !== "recording") return;

          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = "#3b82f6";
          ctx.fillRect(50 + Math.sin(frame * 0.1) * 50, 50, 100, 100);

          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(400 + Math.cos(frame * 0.05) * 100, 225, 50, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#10b981";
          ctx.fillRect(600, 300 + Math.sin(frame * 0.08) * 30, 80, 80);

          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(750, 50, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#fff";
          ctx.font = "16px Arial";
          ctx.fillText("REC", 720, 55);
          ctx.fillText(
            `${Math.floor(recordingTime / 60)}:${(recordingTime % 60)
              .toString()
              .padStart(2, "0")}`,
            680,
            80
          );

          frame++;
          requestAnimationFrame(animate);
        };
        animate();
      }
    }
  }, [recordingState, recordingTime]);

  const stopDemo = useCallback(() => {
    setRecordingState("stopped");
    setShowDemo(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          setRecordedChunks([blob]);
          const url = URL.createObjectURL(blob);
          setRecordedVideoUrl(url);
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = null;
            videoPreviewRef.current.src = url;
            videoPreviewRef.current.controls = true;
            videoPreviewRef.current
              .play()
              .catch((err) => console.error("Demo playback error:", err));
          }
        }
      }, "image/png");
    }
  }, []);

  const startScreenCapture = useCallback(async () => {
    try {
      setError(null);

      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error("Screen recording is not supported in this browser.");
      }

      if (!window.isSecureContext && window.location.hostname !== "localhost") {
        throw new Error("Screen recording requires HTTPS.");
      }

      const constraints = getVideoConstraints();
      let finalStream: MediaStream;

      try {
        finalStream = await navigator.mediaDevices.getDisplayMedia(constraints);
        console.log("Screen capture started successfully");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Screen capture error:", err);
        if (err.name === "NotAllowedError") {
          setError(
            "Screen sharing permission was denied. Please allow screen sharing and try again."
          );
        } else if (err.name === "NotSupportedError") {
          setError(
            "Screen recording is not supported in this browser or environment."
          );
        } else {
          setError(
            `Failed to capture screen: ${err.message || "Unknown error"}`
          );
        }
        return;
      }

      if (
        recordingOptions.includeAudio &&
        recordingOptions.audioSource !== "system"
      ) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          const audioTrack = audioStream.getAudioTracks()[0];
          console.log("Microphone access granted");

          if (recordingOptions.audioSource === "both") {
            finalStream.addTrack(audioTrack);
          } else if (recordingOptions.audioSource === "microphone") {
            const videoTrack = finalStream.getVideoTracks()[0];
            finalStream = new MediaStream([videoTrack, audioTrack]);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (audioErr: any) {
          console.warn("Microphone access error:", audioErr);
          setError(
            "Microphone access was denied. Recording without microphone audio."
          );
        }
      }

      setStream(finalStream);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = finalStream;
        videoPreviewRef.current.removeAttribute("src");
        videoPreviewRef.current.controls = false;
        videoPreviewRef.current
          .play()
          .catch((err) => console.error("Video playback error:", err));
      }

      const mimeTypes = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
        "video/mp4;codecs=avc1",
      ];
      const mimeType =
        mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) ||
        "video/webm";
      console.log("Selected MIME type:", mimeType);

      const mediaRecorder = new MediaRecorder(finalStream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
          console.log("Received data chunk, size:", event.data.size);
        }
      };

      mediaRecorder.onstop = () => {
        setRecordingState("stopped");
        if (timerRef.current) clearInterval(timerRef.current);
        console.log("Recording stopped");
        const blob = new Blob(recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
          videoPreviewRef.current.src = url;
          videoPreviewRef.current.controls = true;
          videoPreviewRef.current
            .play()
            .catch((err) => console.error("Playback error:", err));
        }
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mediaRecorder.onerror = (event: any) => {
        console.error("MediaRecorder error:", event.error);
        setError(`Recording error: ${event.error?.message || "Unknown error"}`);
        setRecordingState("idle");
        cleanupStream();
      };

      finalStream.getVideoTracks()[0].onended = () => {
        stopRecording();
        console.log("Screen sharing stopped by user");
      };

      mediaRecorder.start(1000);
      setRecordingState("recording");
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Start screen capture error:", err);
      setError(`Failed to start recording: ${err.message || "Unknown error"}`);
      cleanupStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingOptions, recordedChunks, cleanupStream]);

  const startRecording = useCallback(async () => {
    if (isInIframe || error?.includes("permissions policy")) {
      console.log("Starting demo mode due to iframe or permissions policy");
      startDemo();
      return;
    }

    if (!stream) {
      await startScreenCapture();
    }
  }, [isInIframe, error, stream, startScreenCapture, startDemo]);

  const pauseRecording = useCallback(() => {
    if (showDemo) {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingState("paused");
      return;
    }

    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerRef.current) clearInterval(timerRef.current);
      console.log("Recording paused");
    }
  }, [showDemo, recordingState]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      console.log("Recording resumed");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDemo, recordingState, stopDemo]);

  const stopRecording = useCallback(() => {
    if (showDemo) {
      stopDemo();
      return;
    }

    if (
      mediaRecorderRef.current &&
      (recordingState === "recording" || recordingState === "paused")
    ) {
      mediaRecorderRef.current.stop();
    }
    cleanupStream();
  }, [showDemo, recordingState, stopDemo, cleanupStream]);

  const downloadRecording = useCallback(() => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, {
      type: showDemo ? "image/png" : "video/webm",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `screen-recording-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.${showDemo ? "png" : "webm"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Recording downloaded");
  }, [recordedChunks, showDemo]);

  const resetRecording = useCallback(() => {
    setRecordingState("idle");
    setRecordedChunks([]);
    setRecordingTime(0);
    setRecordedVideoUrl(null);
    setError(null);
    setShowDemo(false);
    cleanupStream();
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
      videoPreviewRef.current.removeAttribute("src");
      videoPreviewRef.current.controls = false;
    }
    console.log("Recording reset");
  }, [cleanupStream]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getRecordingStateColor = () => {
    switch (recordingState) {
      case "recording":
        return "bg-red-500";
      case "paused":
        return "bg-yellow-500";
      case "stopped":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const openInNewTab = () => {
    window.open(window.location.href, "_blank");
    console.log("Opened in new tab");
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container flex h-16 items-center px-4">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </header>
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-red-600">
                Browser Not Supported
              </CardTitle>
              <CardDescription>
                Screen recording requires a modern browser with Screen Capture
                API support.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Please use one of the following browsers:
              </p>
              <div className="space-y-2">
                <Badge variant="outline">Chrome 72+</Badge>
                <Badge variant="outline">Firefox 66+</Badge>
                <Badge variant="outline">Edge 79+</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center space-x-2 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Video className="h-5 w-5" />
            <span className="font-semibold">Screen Recorder</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {isInIframe && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-800">
                    Limited Functionality
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Screen recording is restricted in embedded environments.
                    Open in a new tab or use demo mode.
                  </p>
                  <Button
                    onClick={openInNewTab}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Monitor className="h-5 w-5" />
                    <span>
                      {showDemo
                        ? "Demo Recording"
                        : recordingState === "stopped"
                        ? "Recorded Video"
                        : "Screen Preview"}
                    </span>
                  </CardTitle>
                  {recordingState !== "idle" && (
                    <div className="flex items-center space-x-2">
                      <div
                        className={`h-3 w-3 rounded-full ${getRecordingStateColor()} ${
                          recordingState === "recording" ? "animate-pulse" : ""
                        }`}
                      ></div>
                      <Badge
                        variant={
                          recordingState === "recording"
                            ? "destructive"
                            : recordingState === "paused"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {recordingState.charAt(0).toUpperCase() +
                          recordingState.slice(1)}
                      </Badge>
                      <div className="flex items-center space-x-1 text-sm font-mono">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(recordingTime)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  {showDemo ? (
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full object-contain"
                    />
                  ) : stream || recordedVideoUrl ? (
                    <video
                      ref={videoPreviewRef}
                      autoPlay={recordingState !== "stopped"}
                      muted={recordingState !== "stopped"}
                      controls={recordingState === "stopped"}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <div className="text-center space-y-4">
                        <Monitor className="h-16 w-16 mx-auto opacity-50" />
                        <p className="text-lg">
                          Click &quot;Start Recording&quot; to begin
                        </p>
                        <p className="text-sm opacity-75">
                          {isInIframe
                            ? "Demo mode will be used"
                            : "Your screen will appear here"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start space-x-2">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-red-800">
                          Recording Issue
                        </h3>
                        <p className="text-sm text-red-600 mt-1">{error}</p>
                        {error.includes("permissions policy") && (
                          <div className="mt-2 text-xs text-red-600">
                            <p>Try these steps:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              <li>Open this page in a new tab</li>
                              <li>Use demo mode (click Start Recording)</li>
                              <li>Access the page directly (not embedded)</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center space-x-4 mt-6">
                  {recordingState === "idle" && (
                    <Button onClick={startRecording} size="lg" className="h-12">
                      <Video className="mr-2 h-5 w-5" />
                      {isInIframe ? "Start Demo" : "Start Recording"}
                    </Button>
                  )}

                  {recordingState === "recording" && (
                    <>
                      <Button
                        onClick={pauseRecording}
                        variant="outline"
                        size="lg"
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                      <Button
                        onClick={stopRecording}
                        variant="destructive"
                        size="lg"
                      >
                        <Square className="mr-2 h-4 w-4" />
                        Stop
                      </Button>
                    </>
                  )}

                  {recordingState === "paused" && (
                    <>
                      <Button onClick={resumeRecording} size="lg">
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </Button>
                      <Button
                        onClick={stopRecording}
                        variant="destructive"
                        size="lg"
                      >
                        <Square className="mr-2 h-4 w-4" />
                        Stop
                      </Button>
                    </>
                  )}

                  {recordingState === "stopped" &&
                    recordedChunks.length > 0 && (
                      <>
                        <Button onClick={downloadRecording} size="lg">
                          <Download className="mr-2 h-4 w-4" />
                          Download {showDemo ? "Image" : "Video"}
                        </Button>
                        <Button
                          onClick={resetRecording}
                          variant="outline"
                          size="lg"
                        >
                          <Video className="mr-2 h-4 w-4" />
                          New Recording
                        </Button>
                      </>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Recording Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure your recording preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="include-audio"
                      className="flex items-center space-x-2"
                    >
                      <Mic className="h-4 w-4" />
                      <span>Include Audio</span>
                    </Label>
                    <Switch
                      id="include-audio"
                      checked={recordingOptions.includeAudio}
                      onCheckedChange={(checked) =>
                        setRecordingOptions((prev) => ({
                          ...prev,
                          includeAudio: checked,
                        }))
                      }
                      disabled={recordingState !== "idle"}
                    />
                  </div>

                  {recordingOptions.includeAudio && (
                    <div className="space-y-2">
                      <Label>Audio Source</Label>
                      <Select
                        value={recordingOptions.audioSource}
                        onValueChange={(
                          value: "microphone" | "system" | "both"
                        ) =>
                          setRecordingOptions((prev) => ({
                            ...prev,
                            audioSource: value,
                          }))
                        }
                        disabled={recordingState !== "idle"}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="microphone">
                            Microphone Only
                          </SelectItem>
                          <SelectItem value="system">
                            System Audio Only
                          </SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Video Quality</Label>
                  <Select
                    value={recordingOptions.videoQuality}
                    onValueChange={(value: "720p" | "1080p" | "4k") =>
                      setRecordingOptions((prev) => ({
                        ...prev,
                        videoQuality: value,
                      }))
                    }
                    disabled={recordingState !== "idle"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p (HD)</SelectItem>
                      <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                      <SelectItem value="4k">4K (Ultra HD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Frame Rate: {recordingOptions.frameRate} FPS</Label>
                  <Slider
                    value={[recordingOptions.frameRate]}
                    onValueChange={([value]) =>
                      setRecordingOptions((prev) => ({
                        ...prev,
                        frameRate: value,
                      }))
                    }
                    min={15}
                    max={60}
                    step={15}
                    disabled={recordingState !== "idle"}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>15 FPS</span>
                    <span>30 FPS</span>
                    <span>45 FPS</span>
                    <span>60 FPS</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5" />
                  <span>Recording Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Mode:</span>
                  <Badge variant="outline">
                    {showDemo ? "Demo" : isInIframe ? "Embedded" : "Full"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <Badge
                    variant={
                      recordingState === "recording"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {recordingState.charAt(0).toUpperCase() +
                      recordingState.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span className="font-mono">{formatTime(recordingTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Quality:</span>
                  <span>{recordingOptions.videoQuality}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Frame Rate:</span>
                  <span>{recordingOptions.frameRate} FPS</span>
                </div>
                {recordedChunks.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>File Size:</span>
                    <span>
                      {(
                        recordedChunks.reduce(
                          (acc, chunk) => acc + chunk.size,
                          0
                        ) /
                        1024 /
                        1024
                      ).toFixed(2)}
                      MB
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💡 Tips & Troubleshooting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Use Chrome, Firefox, or Edge for best compatibility</p>
                <p>• Ensure HTTPS or localhost for screen capture</p>
                <p>• Grant screen and microphone permissions when prompted</p>
                <p>• Close other applications to improve performance</p>
                <Separator className="my-3" />
                <p className="font-medium text-foreground">
                  If recording fails:
                </p>
                <p>• Check browser permissions for screen and microphone</p>
                <p>• Open in a new tab if embedded</p>
                <p>• Try demo mode to test the interface</p>
                <p>• Refresh the page and try again</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
