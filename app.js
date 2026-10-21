
const EAF = {
  get(key, fallback = []) {
    try {
      return JSON.parse(localStorage.getItem("eaf_" + key)) ?? fallback;
    } catch {
      return fallback;
    }
  },

  save(key, value) {
    localStorage.setItem("eaf_" + key, JSON.stringify(value));
  },

  escape(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  },

  date(value) {
    if (!value) return "Date to be confirmed";
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? this.escape(value)
      : d.toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short"
        });
  },

  id() {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(16).slice(2);
  },

  header() {
    const page = document.body.dataset.page;
    const links = [
      ["Home", "index.html", "home"],
      ["About", "about.html", "about"],
      ["Community", "community.html", "community"],
      ["Events", "events.html", "events"],
      ["Meetings", "meetings.html", "meetings"],
      ["Chat", "chat.html", "chat"]
    ];

    document.querySelector("#site-header").innerHTML = `
      <header class="site-header">
        <div class="navbar">
          <a class="brand" href="index.html">
            <span class="brand-mark">E</span>
            <span>EAF<small>EMERGENCE ARTS FORUM</small></span>
          </a>
          <button class="menu-toggle" id="menu-toggle"
            aria-label="Toggle navigation" aria-expanded="false">☰</button>
          <nav class="nav-links" id="nav-links">
            ${links.map(([name, url, id]) => `
              <a class="${page === id ? "active" : ""}"
                 href="${url}">${name}</a>
            `).join("")}
            <a class="nav-cta" href="join.html">Join EAF ↗</a>
            <a href="dashboard.html">Dashboard</a>
          </nav>
        </div>
      </header>`;

    const toggle = document.querySelector("#menu-toggle");
    const nav = document.querySelector("#nav-links");

    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "×" : "☰";
    });
  },

  footer() {
    document.querySelector("#site-footer").innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <a class="brand" href="index.html">
                <span class="brand-mark">E</span>
                <span>EAF<small>EMERGENCE ARTS FORUM</small></span>
              </a>
              <p style="margin-top:15px">
                A home for people shaping culture through creativity,
                collaboration and conversation.
              </p>
            </div>
            <div>
              <h4>EXPLORE</h4>
              <a href="about.html">About EAF</a>
              <a href="community.html">Community</a>
              <a href="events.html">Events</a>
              <a href="meetings.html">Meetings</a>
            </div>
            <div>
              <h4>TAKE PART</h4>
              <a href="join.html">Join the forum</a>
              <a href="chat.html">Community chat</a>
              <a href="dashboard.html">Dashboard</a>
              <a href="mailto:YOUR_OFFICIAL_EMAIL">Contact us</a>
            </div>
          </div>
          <div class="footer-bottom">
            © ${new Date().getFullYear()} Emergence Arts Forum.
            Built for creativity and community.
          </div>
        </div>
      </footer>`;
  },

  defaultEvents() {
    return [
      {
        id: "welcome",
        title: "EAF Community Welcome",
        date: "2026-10-30T17:00",
        location: "Online — meeting link to be announced",
        category: "Gathering",
        description: "Meet the community and share ideas for EAF."
      },
      {
        id: "roundtable",
        title: "Creative Practice Roundtable",
        date: "2026-11-07T15:00",
        location: "Venue to be announced",
        category: "Talk",
        description: "A conversation about creative practice and collaboration."
      }
    ];
  },

  events() {
    const root = document.querySelector("#event-list");
    if (!root) return;

    const getEvents = () =>
      this.get("events", this.defaultEvents());

    const draw = () => {
      const events = getEvents().sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      root.innerHTML = events.length
        ? events.map(event => `
          <article class="list-item">
            <div>
              <span class="tag">${this.escape(event.category)}</span>
              <h3>${this.escape(event.title)}</h3>
              <p>${this.escape(this.date(event.date))}</p>
              <p>${this.escape(event.location)}</p>
              <p>${this.escape(event.description || "")}</p>
            </div>
            <div>
              ${/^https?:\/\//i.test(event.location) ? `
                <a class="button button-primary"
                   href="${this.escape(event.location)}"
                   target="_blank" rel="noopener noreferrer">Open link ↗</a>
              ` : ""}
              ${event.custom ? `
                <button class="icon-button"
                  data-delete="${this.escape(event.id)}">Delete</button>
              ` : ""}
            </div>
          </article>
        `).join("")
        : `<div class="empty-state">No events have been added yet.</div>`;
    };

    document.querySelector("#toggle-event-form")
      ?.addEventListener("click", () => {
        document.querySelector("#event-form").classList.toggle("hidden");
      });

    document.querySelector("#event-form")
      ?.addEventListener("submit", event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const events = getEvents();

        events.push({
          id: this.id(),
          title: form.get("title").trim(),
          date: form.get("date"),
          location: form.get("location").trim(),
          category: form.get("category"),
          description: form.get("description").trim(),
          custom: true
        });

        this.save("events", events);
        event.currentTarget.reset();
        event.currentTarget.classList.add("hidden");
        draw();
      });

    root.addEventListener("click", event => {
      const button = event.target.closest("[data-delete]");
      if (!button) return;

      this.save(
        "events",
        getEvents().filter(item => item.id !== button.dataset.delete)
      );
      draw();
    });

    draw();
  },

  join() {
    const form = document.querySelector("#join-form");
    if (!form) return;

    form.addEventListener("submit", event => {
      event.preventDefault();

      const data = new FormData(form);
      const profile = {
        id: this.id(),
        name: data.get("name").trim(),
        email: data.get("email").trim(),
        practice: data.get("practice"),
        location: data.get("location").trim(),
        bio: data.get("bio").trim()
      };

      const members = this.get("members", []).filter(
        member => member.email.toLowerCase() !==
          profile.email.toLowerCase()
      );

      members.unshift(profile);
      this.save("members", members);
      this.save("profile", profile);

      const message = document.querySelector("#join-success");
      message.textContent =
        `Welcome, ${profile.name}! Your profile is saved in this browser.`;
      message.classList.remove("hidden");

      form.reset();
    });
  },

  community() {
    const root = document.querySelector("#member-directory");
    if (!root) return;

    const search = document.querySelector("#member-search");

    const draw = () => {
      const query = search.value.toLowerCase();
      const members = this.get("members", []).filter(member =>
        [member.name, member.practice, member.location, member.bio]
          .join(" ").toLowerCase().includes(query)
      );

      root.innerHTML = members.length
        ? members.map(member => `
          <article class="list-item">
            <div>
              <h3>${this.escape(member.name)}</h3>
              <p>${this.escape(member.practice)}
                ${member.location ? " · " + this.escape(member.location) : ""}
              </p>
              <p>${this.escape(member.bio || "")}</p>
            </div>
          </article>
        `).join("")
        : `<div class="empty-state">
            No local member profiles yet. Create one to get started.
          </div>`;
    };

    search.addEventListener("input", draw);
    draw();
  },

  meetings() {
    const form = document.querySelector("#meeting-form");
    const root = document.querySelector("#meeting-list");
    if (!root) return;

    const getMeetings = () => this.get("meetings", []);

    const draw = () => {
      const meetings = getMeetings().sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      root.innerHTML = meetings.length
        ? meetings.map(meeting => `
          <article class="list-item">
            <div>
              <h3>${this.escape(meeting.title)}</h3>
              <p>${this.escape(this.date(meeting.date))}</p>
              <p>${this.escape(meeting.agenda || "No agenda added.")}</p>
              <a class="button button-primary"
                 href="${this.escape(meeting.link)}"
                 target="_blank" rel="noopener noreferrer">
                 Join live meeting ↗
              </a>
            </div>
            <button class="icon-button"
              data-delete-meeting="${this.escape(meeting.id)}">Delete</button>
          </article>
        `).join("")
        : `<div class="empty-state">No meetings scheduled yet.</div>`;
    };

    form?.addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(form);
      const link = data.get("link").trim();

      try {
        const url = new URL(link);
        if (!["https:", "http:"].includes(url.protocol)) throw Error();
      } catch {
        alert("Enter a valid meeting URL beginning with https://");
        return;
      }

      const meetings = getMeetings();
      meetings.push({
        id: this.id(),
        title: data.get("title").trim(),
        date: data.get("date"),
        link,
        agenda: data.get("agenda").trim()
      });

      this.save("meetings", meetings);
      form.reset();
      draw();
    });

    root.addEventListener("click", event => {
      const button = event.target.closest("[data-delete-meeting]");
      if (!button) return;

      this.save(
        "meetings",
        getMeetings().filter(m => m.id !== button.dataset.deleteMeeting)
      );
      draw();
    });

    draw();
  },

  chat() {
    const root = document.querySelector("#chat-messages");
    const form = document.querySelector("#chat-form");
    if (!root || !form) return;

    const getMessages = () => this.get("messages", []);

    const draw = () => {
      const messages = getMessages();

      root.innerHTML = messages.length
        ? messages.map(message => `
          <div class="message ${message.mine ? "mine" : ""}">
            <small>${this.escape(message.name)} ·
              ${this.escape(new Date(message.time).toLocaleTimeString([], {
                hour: "2-digit", minute: "2-digit"
              }))}
            </small>
            ${this.escape(message.text)}
          </div>
        `).join("")
        : `<div class="empty-state">
            Welcome to the EAF Common Room. Share an idea to start.
          </div>`;

      root.scrollTop = root.scrollHeight;
    };

    form.addEventListener("submit", event => {
      event.preventDefault();

      const input = document.querySelector("#chat-input");
      const text = input.value.trim();
      if (!text) return;

      const profile = this.get("profile", null);
      const messages = getMessages();

      messages.push({
        name: profile?.name || "Guest",
        text,
        time: new Date().toISOString(),
        mine: true
      });

      this.save("messages", messages.slice(-200));
      input.value = "";
      draw();
    });

    document.querySelector("#clear-chat")
      ?.addEventListener("click", () => {
        if (!confirm("Clear all messages saved in this browser?")) return;
        this.save("messages", []);
        draw();
      });

    draw();
  },

  dashboard() {
    const profile = this.get("profile", null);
    const profileRoot = document.querySelector("#dashboard-profile");

    if (profileRoot) {
      profileRoot.innerHTML = profile
        ? `<h3>${this.escape(profile.name)}</h3>
           <p>${this.escape(profile.practice)}</p>
           <p>${this.escape(profile.email)}</p>
           <p>${this.escape(profile.location)}</p>`
        : `<p>You have not created a profile on this device yet.</p>`;
    }

    const events = this.get("events", this.defaultEvents());
    const meetings = this.get("meetings", []);
    const members = this.get("members", []);

    document.querySelector("#dashboard-members").textContent = members.length;
    document.querySelector("#dashboard-events").textContent = events.length;
    document.querySelector("#dashboard-meetings").textContent = meetings.length;
  },

  init() {
    this.header();
    this.footer();
    this.events();
    this.join();
    this.community();
    this.meetings();
    this.chat();

    if (document.body.dataset.page === "dashboard") this.dashboard();
  }
};

document.addEventListener("DOMContentLoaded", () => EAF.init());
