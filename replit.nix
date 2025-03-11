{pkgs}: {
  deps = [
    pkgs.zip
    pkgs.portaudio
    pkgs.sox
    pkgs.libsndfile
    pkgs.ffmpeg
    pkgs.lsof
  ];
}
