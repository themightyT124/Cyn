{pkgs}: {
  deps = [
    pkgs.portaudio
    pkgs.sox
    pkgs.libsndfile
    pkgs.ffmpeg
    pkgs.lsof
  ];
}
