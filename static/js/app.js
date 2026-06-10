let pieChart2 = null;
let lastSummary = null;
function showPage(page, title, subtitle, el) {
  // Hide all pages
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  // Show selected page
  document.getElementById("page-" + page).classList.add("active");
  // Update topbar title
  document.getElementById("page-title").textContent = title;
  document.getElementById("page-sub").textContent = subtitle;
  // Update active nav
  document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
  el.classList.add("active");
  // If analytics page, render the second chart
  if (page === "analytics" && lastSummary) {
    renderChart2(lastSummary);
  }
  return false;
}
// config and constants
const COLORS = {
  hate_speech:       { bg: "rgba(226,75,74,0.15)",  text: "#E24B4A", bar: "#E24B4A" },
  threat:            { bg: "rgba(186,117,23,0.15)", text: "#EF9F27", bar: "#EF9F27" },
  offensive:         { bg: "rgba(216,90,48,0.15)",  text: "#D85A30", bar: "#D85A30" },
  not_cyberbullying: { bg: "rgba(29,158,117,0.15)", text: "#1D9E75", bar: "#1D9E75" }
};

const EXAMPLES = [
  "You're so talented, keep it up!",
  "I hate people like you, go back where you came from",
  "Watch your back, I know where you live",
  "Great job on the presentation today!",
  "You're such an idiot, how are you this dumb",
  "Hope you have an amazing weekend!"
].join("\n");

let pieChart = null;

// helper function
function loadExample() {
  document.getElementById("input-text").value = EXAMPLES;
}

function clearResults() {
  document.getElementById("results-list").innerHTML = "";
  document.getElementById("results-section").classList.remove("visible");
  document.getElementById("input-text").value = "";
  updateStats({ total: 0, harmful: 0, safe: 0, hate_speech: 0, threat: 0 });
  if (pieChart) {
    pieChart.destroy();
    pieChart = null;
  }
  document.getElementById("chart-placeholder").style.display = "flex";
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// animate stats
function animateNumber(el, target) {
  const start = parseInt(el.textContent) || 0;
  const duration = 400;
  const startTime = performance.now();

  const update = (now) => {
    const t = Math.min((now - startTime) / duration, 1);
    el.textContent = Math.round(start + (target - start) * t);
    if (t < 1) requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
}

function updateStats(summary) {
  animateNumber(document.getElementById("stat-total"),   summary.total);
  animateNumber(document.getElementById("stat-harmful"), summary.harmful);
  animateNumber(document.getElementById("stat-safe"),    summary.safe);
  animateNumber(document.getElementById("stat-hate"),    summary.hate_speech);
  animateNumber(document.getElementById("stat-threat"),  summary.threat);
}

// render chart
function renderChart(summary) {
  document.getElementById("chart-placeholder").style.display = "none";
  const ctx = document.getElementById("pie-chart").getContext("2d");

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Safe", "Hate Speech", "Threat", "Offensive"],
      datasets: [{
        data: [
          summary.safe,
          summary.hate_speech,
          summary.threat,
          summary.offensive
        ],
        backgroundColor: ["#1D9E75", "#E24B4A", "#EF9F27", "#D85A30"],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#6B7385",
            font: { family: "'DM Sans'", size: 12 },
            padding: 14,
            boxWidth: 12,
            boxHeight: 12
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw} comment${ctx.raw !== 1 ? "s" : ""}`
          }
        }
      },
      animation: { animateRotate: true, duration: 700 }
    }
  });
}

function renderChart2(summary) {
  document.getElementById("chart-placeholder-2").style.display = "none";
  const ctx = document.getElementById("pie-chart-2").getContext("2d");
  if (pieChart2) pieChart2.destroy();

  pieChart2 = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Safe", "Hate Speech", "Threat", "Offensive"],
      datasets: [{
        data: [
          summary.safe,
          summary.hate_speech,
          summary.threat,
          summary.offensive
        ],
        backgroundColor: ["#1D9E75", "#E24B4A", "#EF9F27", "#D85A30"],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#6B7385",
            font: { family: "'DM Sans'", size: 12 },
            padding: 14,
            boxWidth: 12,
            boxHeight: 12
          }
        }
      },
      animation: { animateRotate: true, duration: 700 }
    }
  });

  // Update analytics stat cards
  animateNumber(document.getElementById("stat-total-2"),    summary.total);
  animateNumber(document.getElementById("stat-harmful-2"),  summary.harmful);
  animateNumber(document.getElementById("stat-safe-2"),     summary.safe);
  animateNumber(document.getElementById("stat-hate-2"),     summary.hate_speech);
  animateNumber(document.getElementById("stat-threat-2"),   summary.threat);
  animateNumber(document.getElementById("stat-offensive-2"),summary.offensive || 0);
}

// render results cards
function renderResults(results) {
  const container = document.getElementById("results-list");
  container.innerHTML = "";

  results.forEach((r, i) => {
    const c = COLORS[r.label] || COLORS["not_cyberbullying"];
    const item = document.createElement("div");
    item.className = "result-item";
    item.style.animationDelay = `${i * 60}ms`;

    item.innerHTML = `
      <span class="result-label-badge" style="background:${c.bg}; color:${c.text};">
        ${r.display_label}
      </span>
      <div class="result-body">
        <p class="result-text">${escapeHtml(r.text)}</p>
        <div class="result-meta">
          <span>${r.description}</span>
          <div class="confidence-bar-wrap">
            <span>${r.confidence}% confidence</span>
            <div class="confidence-bar">
              <div class="confidence-fill"
                   style="width:0%; background:${c.bar};"
                   data-target="${r.confidence}">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(item);
  });

  setTimeout(() => {
    document.querySelectorAll(".confidence-fill").forEach(el => {
      el.style.width = el.dataset.target + "%";
    });
  }, 100);
}

// main analyze function 
async function analyze() {
  const raw = document.getElementById("input-text").value.trim();
  if (!raw) return;

  const texts = raw.split("\n").map(t => t.trim()).filter(Boolean);
  if (texts.length === 0) return;

  const btn = document.getElementById("analyze-btn");
  document.getElementById("btn-text").style.display = "none";
  document.getElementById("btn-loader").style.display = "inline";
  btn.disabled = true;

  try {
    const res = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts })
    });

    const data = await res.json();
    if (data.error) {
      alert("Error: " + data.error);
      return;
    }

    updateStats(data.summary);
    lastSummary = data.summary;
    renderChart(data.summary);
    renderResults(data.results);

    document.getElementById("results-section").classList.add("visible");
    document.getElementById("results-section").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  } catch (err) {
    alert("Could not connect to server. Make sure Flask is running.");
    console.error(err);
  } finally {
    document.getElementById("btn-text").style.display = "inline";
    document.getElementById("btn-loader").style.display = "none";
    btn.disabled = false;
  }
}


// keyboard shortcuts
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("input-text").addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") analyze();
  });
});