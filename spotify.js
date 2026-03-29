let currentSong = new Audio();
let songs = [];
let currentIndex = 0;
let isDragging = false;
let currFolder = "";

// FEATURES
let isShuffle = false;
let isRepeat = false;

// FETCH SONGS
async function getSongs(folder) {
    currFolder = folder;

    let a = await fetch(`http://127.0.0.1:5500/${folder}`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    let newSongs = [];

    for (let i = 0; i < as.length; i++) {
        if (as[i].href.endsWith(".mp3")) {
            newSongs.push(as[i].href);
        }
    }

    return newSongs;
}

// PLAY MUSIC
const playMusic = (track, index = 0, autoPlay = true) => {

    currentSong.src = `/${currFolder}/` + encodeURIComponent(track);

    // duration before play
    currentSong.onloadedmetadata = () => {
        let total = currentSong.duration;

        let min = Math.floor(total / 60);
        let sec = Math.floor(total % 60);
        if (sec < 10) sec = "0" + sec;

        document.querySelector(".songtime").innerHTML =
            `0:00 / ${min}:${sec}`;
    };

    if (autoPlay) {
        currentSong.play();
        play.src = "pause.svg";
    } else {
        play.src = "play.svg";
    }

    currentIndex = index;

    // song name
    let name = track.split(" - ")[0];
    document.querySelector(".songinfo").innerHTML = name;

    // highlight song
    document.querySelectorAll(".songList li").forEach(li => {
        li.style.background = "";
    });

    let currentLi = document.querySelectorAll(".songList li")[index];
    if (currentLi) currentLi.style.background = "#2a2a2a";

    // list icon update
    document.querySelectorAll(".listPlay").forEach(img => {
        img.src = "play.svg";
    });

    let currentIcon = document.querySelectorAll(".listPlay")[index];
    if (currentIcon) currentIcon.src = "pause.svg";
};

// LOAD SONG LIST
function loadSongList() {
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    songs.forEach((song, index) => {
        let clean = decodeURIComponent(song).split(`/${currFolder}/`)[1];

        songUL.innerHTML += `
        <li>
            <img src="music.svg">
            <div class="info">
                <div>${clean}</div>
                <div>Song Artist</div>
            </div>
            <div class="playnow">
                <img class="listPlay" src="play.svg">
            </div>
        </li>`;
    });

    // click song
    Array.from(document.querySelectorAll(".songList li"))
        .forEach((e, index) => {
            e.addEventListener("click", () => {
                let track = e.querySelector(".info div").innerText.trim();
                playMusic(track, index);
            });
        });
}

// MAIN
async function main() {

    // default playlist
    songs = await getSongs("songs/s1");
    loadSongList();

    // first song (no autoplay)
    if (songs.length > 0) {
        let first = decodeURIComponent(songs[0]).split(`/${currFolder}/`)[1];
        playMusic(first, 0, false);
    }

    let play = document.getElementById("play");

    // play / pause
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
            document.querySelectorAll(".listPlay")[currentIndex].src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "play.svg";
            document.querySelectorAll(".listPlay")[currentIndex].src = "play.svg";
        }
    });

    // time update
    currentSong.addEventListener("timeupdate", () => {
        if (!isNaN(currentSong.duration)) {

            let cur = currentSong.currentTime;
            let total = currentSong.duration;

            let cm = Math.floor(cur / 60);
            let cs = Math.floor(cur % 60);
            let tm = Math.floor(total / 60);
            let ts = Math.floor(total % 60);

            if (cs < 10) cs = "0" + cs;
            if (ts < 10) ts = "0" + ts;

            document.querySelector(".songtime").innerHTML =
                `${cm}:${cs} / ${tm}:${ts}`;

            document.querySelector(".circle").style.left =
                (cur / total) * 100 + "%";
        }
    });

    // seekbar
    let seekbar = document.querySelector(".seekbar");
    let circle = document.querySelector(".circle");

    seekbar.addEventListener("click", (e) => {
        let percent = e.offsetX / seekbar.clientWidth;
        currentSong.currentTime = percent * currentSong.duration;
    });

    circle.addEventListener("mousedown", () => isDragging = true);
    document.addEventListener("mouseup", () => isDragging = false);

    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            let rect = seekbar.getBoundingClientRect();
            let x = e.clientX - rect.left;

            x = Math.max(0, Math.min(x, rect.width));

            let percent = x / rect.width;

            circle.style.left = percent * 100 + "%";
            currentSong.currentTime = percent * currentSong.duration;
        }
    });

    // next
    document.getElementById("next").addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % songs.length;
        let track = decodeURIComponent(songs[currentIndex]).split(`/${currFolder}/`)[1];
        playMusic(track, currentIndex);
    });

    // previous
    document.getElementById("previous").addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + songs.length) % songs.length;
        let track = decodeURIComponent(songs[currentIndex]).split(`/${currFolder}/`)[1];
        playMusic(track, currentIndex);
    });

    // shuffle toggle
    document.getElementById("shuffle").addEventListener("click", () => {
        isShuffle = !isShuffle;
        document.getElementById("shuffle").style.opacity = isShuffle ? "1" : "0.5";
    });

    // repeat toggle
    document.getElementById("repeat").addEventListener("click", () => {
        isRepeat = !isRepeat;
        document.getElementById("repeat").style.opacity = isRepeat ? "1" : "0.5";
    });

    // AUTO PLAY (important)
    currentSong.addEventListener("ended", () => {

        if (isRepeat) {
            currentSong.currentTime = 0;
            currentSong.play();
            return;
        }

        if (isShuffle) {
            currentIndex = Math.floor(Math.random() * songs.length);
        } else {
            currentIndex = (currentIndex + 1) % songs.length;
        }

        let track = decodeURIComponent(songs[currentIndex])
            .split(`/${currFolder}/`)[1];

        playMusic(track, currentIndex);
    });

    // playlist click
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async (e) => {

            let folder = e.currentTarget.dataset.folder;

            songs = await getSongs(`songs/${folder}`);
            loadSongList();

            if (songs.length > 0) {
                let first = decodeURIComponent(songs[0]).split(`/${currFolder}/`)[1];
                playMusic(first, 0, false);
            }
        });
    });
}

main();