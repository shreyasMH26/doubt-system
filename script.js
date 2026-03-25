let doubts = [];
let chart = null;
let currentUser = "";
let currentRole = "";
let userId = "";

// banned words
const bannedWords = ["idiot", "stupid", "hate", "fool"];

// INIT
document.addEventListener("DOMContentLoaded", () => {
    loadDoubts();
});

// STORAGE
function loadDoubts() {
    const data = localStorage.getItem("doubts");
    doubts = data ? JSON.parse(data) : [];
}

function saveDoubts() {
    localStorage.setItem("doubts", JSON.stringify(doubts));
}

// LOGIN
function login() {
    let name = document.getElementById("nameInput").value.trim();
    let role = document.getElementById("roleSelect").value;

    if (!name) return showToast("Enter your name");

    currentUser = name;
    currentRole = role;
    userId = "U" + Math.floor(Math.random() * 10000);

    document.getElementById("loginPage").classList.add("hidden");

    if (role === "student") showStudent();
    else showTeacher();
}

// NAVIGATION
function showStudent() {
    document.getElementById("studentPage").classList.remove("hidden");
    document.getElementById("teacherPage").classList.add("hidden");
}

function showTeacher() {
    document.getElementById("teacherPage").classList.remove("hidden");
    document.getElementById("studentPage").classList.add("hidden");
    displayDoubts();
}

// TOAST
function showToast(msg) {
    let t = document.getElementById("toast");
    t.innerText = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1500);
}

// SUBMIT
function submitDoubt() {
    let input = document.getElementById("doubtInput");
    let text = input.value.trim().toLowerCase();
    if (!text) return;

    let isBad = bannedWords.some(word => text.includes(word));
    if (isBad) return showToast("⚠️ Inappropriate language!");

    doubts.unshift({
        id: Date.now(),
        text,
        user: currentUser,
        userId,
        votes: 0,
        seen: false,
        answered: false,
        reply: null,
        time: new Date().toLocaleTimeString()
    });

    saveDoubts();
    input.value = "";
    showToast("Doubt submitted!");
    displayDoubts();
}

// DISPLAY
function displayDoubts() {
    let list = document.getElementById("doubtList");
    if (!list) return;

    list.innerHTML = "";

    document.getElementById("count").innerText = doubts.length;

    let answered = doubts.filter(d => d.answered).length;
    document.getElementById("answeredCount").innerText = answered;

    // top user
    let counts = {};
    doubts.forEach(d => counts[d.user] = (counts[d.user] || 0) + 1);
    let topUser = Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
    document.getElementById("topUser").innerText = topUser || "N/A";

    doubts.sort((a, b) => b.votes - a.votes);

    doubts.forEach(d => {

        if (currentRole === "teacher") d.seen = true;

        let div = document.createElement("div");
        div.className = "doubt " + (d.answered ? "answered" : "");

        div.innerHTML = `
        <b>💬 ${d.text}</b><br>
        <small>${d.time}</small><br>

        <small>
        👤 ${currentRole === "teacher" ? d.user + " (" + d.userId + ")" : "Anonymous"}
        </small><br>

        <small>👀 ${d.seen ? "Seen" : "Unseen"}</small><br><br>

        👍 ${d.votes}
        <button onclick="upvote(${d.id})">+1</button>
        <button onclick="markAnswered(${d.id})">✔</button>
        <button onclick="generateAI(${d.id})">🤖</button>

        ${currentRole === "teacher" ? `<button onclick="deleteDoubt(${d.id})">🗑️</button>` : ""}

        ${d.reply ? `<div class="ai">🤖 ${d.reply}</div>` : ""}
        `;

        list.appendChild(div);
    });

    saveDoubts();
    updateChart();
}

// ACTIONS
function upvote(id) {
    let d = doubts.find(x => x.id === id);
    d.votes++;
    saveDoubts();
    displayDoubts();
}

function markAnswered(id) {
    let d = doubts.find(x => x.id === id);
    d.answered = true;
    saveDoubts();
    displayDoubts();
}

function deleteDoubt(id) {
    doubts = doubts.filter(d => d.id !== id);
    saveDoubts();
    displayDoubts();
}

function generateAI(id) {
    let d = doubts.find(x => x.id === id);
    d.reply = "Thinking...";
    displayDoubts();

    setTimeout(() => {
        let res = [
            "Revise basics",
            "Break into steps",
            "Practice similar problems",
            "Focus on concept"
        ];
        d.reply = res[Math.floor(Math.random() * res.length)];
        saveDoubts();
        displayDoubts();
    }, 1000);
}

// CHART
function updateChart() {
    let answered = doubts.filter(d => d.answered).length;
    let pending = doubts.length - answered;

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("chart"), {
        type: "doughnut",
        data: {
            labels: ["Answered", "Pending"],
            datasets: [{
                data: [answered, pending]
            }]
        }
    });
}