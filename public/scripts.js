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

function cleanupPreviousConversion(sectionClass) {
    const existingDownloadLink = document.querySelector(`.${sectionClass} a.btn`);
    if (existingDownloadLink) {
        existingDownloadLink.remove();
    }
}

document.getElementById('convertButton').addEventListener('click', async () => {
    cleanupPreviousConversion('convert-section');
    
    if (window.lastAudioUrl) {
        URL.revokeObjectURL(window.lastAudioUrl);
    }

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
        window.lastAudioUrl = audioUrl;

        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.src = audioUrl;
        audioPlayer.load();

        const downloadLink = document.createElement('a');
        downloadLink.href = audioUrl;
        downloadLink.download = 'converted_audio.mp3';
        downloadLink.className = 'btn btn-primary mt-3';
        downloadLink.textContent = 'Download Audio';
        document.querySelector('.convert-section').appendChild(downloadLink);

        ffmpeg.FS('unlink', 'input.mp4');
        ffmpeg.FS('unlink', 'output.mp3');
    } catch (error) {
        console.error('Error converting video to audio:', error);
        alert('An error occurred while converting the video to audio.');
    }
});

document.getElementById('convertToSlidesButton').addEventListener('click', async () => {
    cleanupPreviousConversion('slides-section');
    
    if (window.lastVideoUrl) {
        URL.revokeObjectURL(window.lastVideoUrl);
    }

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
        ffmpeg.FS('writeFile', 'input.mp4', new Uint8Array(videoData));

        // Single FFmpeg command to create slideshow
        await ffmpeg.run(
            '-i', 'input.mp4',
            '-vf', `fps=${frameRate},setpts=N/(${frameRate}*TB)`,
            '-force_key_frames', `expr:gte(t,n_forced*${1/frameRate})`,
            '-c:v', 'libx264',
            '-c:a', 'copy',
            '-pix_fmt', 'yuv420p',
            'output.mp4'
        );

        // Read and display output
        const data = ffmpeg.FS('readFile', 'output.mp4');
        const slideShowBlob = new Blob([data.buffer], { type: 'video/mp4' });
        const slideShowUrl = URL.createObjectURL(slideShowBlob);
        window.lastVideoUrl = slideShowUrl;

        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.src = slideShowUrl;
        videoPlayer.load();

        const downloadLink = document.createElement('a');
        downloadLink.href = slideShowUrl;
        downloadLink.download = 'slideshow.mp4';
        downloadLink.className = 'btn btn-primary mt-3';
        downloadLink.textContent = 'Download Slideshow';
        document.querySelector('.slides-section').appendChild(downloadLink);

        // Cleanup
        ffmpeg.FS('unlink', 'input.mp4');
        ffmpeg.FS('unlink', 'output.mp4');
    } catch (error) {
        console.error('Error creating slideshow:', error);
        alert('An error occurred while creating the slideshow.');
    }
});

document.getElementById('videoInput').addEventListener('change', function(e) {
    const fileName = e.target.files[0]?.name || 'No file chosen';
    document.getElementById('fileNameDisplay').textContent = fileName;
});