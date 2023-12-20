class LoadManager {
    onStart() {
        document.getElementById('progress-box-wrapper').style.display = 'flex';
    }

    onLoad() {
        document.getElementById('progress-value').style.width = "0";
        document.getElementById('progress-box-wrapper').style.display = 'none';
        document.getElementById('progress-value').classList.remove("bg-danger");
        document.getElementById('progress-value').classList.remove("bg-success");
        document.getElementById('stepName').innerHTML = '';
        document.getElementById('stepName').style.color = 'black';
    }

    onProgress(item, loaded, total) {
        // console.log(Math.round(loaded / total * 100, 2) + '%')
        document.getElementById('progress-value').style.width = (loaded / total * 100).toFixed(2) + '%';
        document.getElementById('stepName').innerHTML = 'در حال بارگزاری مدل';
        document.getElementById('stepName').style.color = 'green';
        document.getElementById('progress-value').classList.remove("bg-danger");
        document.getElementById('progress-value').classList.add("bg-success");
    }

    onError(url) {
        console.log('Error loading');
    }

    onDownload(xhr) {
        document.getElementById('progress-value').classList.add("bg-danger");
        document.getElementById('progress-value').style.width = (xhr.loaded / xhr.total * 100).toFixed(2) + "%";
        document.getElementById('stepName').innerHTML = 'در حال دانلود مدل';
        document.getElementById('stepName').style.color = 'red';
    }
}