const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

async function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('File could not be read! Code=' + reader.error.code));
        reader.readAsArrayBuffer(file);
    });
}

document.getElementById('convertButton').addEventListener('click', async () => {
    const videoFile = document.getElementById('videoInput').files[0];
    if (!videoFile) {
        alert('Please select a video file first.');
        return;
    }

    try {
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        const videoData = await readFileAsArrayBuffer(videoFile);
        console.log('Video data loaded:', videoData);

        ffmpeg.FS('writeFile', 'input.mp4', new Uint8Array(videoData));
        await ffmpeg.run('-i', 'input.mp4', 'output.mp3');
        const data = ffmpeg.FS('readFile', 'output.mp3');
        console.log('FFmpeg output data:', data);

        const audioBlob = new Blob([data.buffer], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('Audio URL:', audioUrl);

        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.src = audioUrl;
        audioPlayer.load(); // Ensure the player reloads the new source

        const downloadLink = document.createElement('a');
        downloadLink.href = audioUrl;
        downloadLink.download = 'converted_audio.mp3';
        downloadLink.textContent = 'Download Audio';
        downloadLink.classList.add('btn');
        document.querySelector('.convert-section').appendChild(downloadLink);
        
    } catch (error) {
        console.error('Error converting video to audio:', error);
        alert('An error occurred while converting the video to audio.');
    }
});

document.getElementById('convertToSlidesButton').addEventListener('click', async () => {
    const videoFile = document.getElementById('videoInput').files[0];
    const frameRate = document.getElementById('frameRate').value;
    if (!videoFile) {
        alert('Please select a video file first.');
        return;
    }

    try {
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        const videoData = await readFileAsArrayBuffer(videoFile);
        console.log('Video data loaded:', videoData);

        ffmpeg.FS('writeFile', 'input.mp4', new Uint8Array(videoData));
        await ffmpeg.run('-i', 'input.mp4', '-vf', `fps=${frameRate}`, '-max_muxing_queue_size', '9999', 'output.mp4');
        const data = ffmpeg.FS('readFile', 'output.mp4');
        console.log('FFmpeg output data:', data);

        const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(videoBlob);
        console.log('Video URL:', videoUrl);

        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.src = videoUrl;
        videoPlayer.load(); // Ensure the player reloads the new source

        const downloadLink = document.createElement('a');
        downloadLink.href = videoUrl;
        downloadLink.download = 'converted_video.mp4';
        downloadLink.textContent = 'Download Video';
        downloadLink.classList.add('btn');
        document.querySelector('.slides-section').appendChild(downloadLink);
    } catch (error) {
        console.error('Error converting video to slides:', error);
        alert('An error occurred while converting the video to slides.');
    }
});