const CONFIG = {
  API_BASE: "https://bouquet.familyiptv.net"
};


const $ = selector =>
  document.querySelector(selector);


const $$ = selector =>
  document.querySelectorAll(selector);


// ==========================================================
// STATE
// ==========================================================

let groups = [];

let defaults = [];

let creds = null;

let currentType = "live";

let loadingGroups = false;


// تخزين مؤقت لكل قسم
const sectionCache = {
  live: null,
  movies: null,
  series: null
};


const sectionDefaults = {
  live: null,
  movies: null,
  series: null
};


// ==========================================================
// SECTION CONFIG
// ==========================================================

const SECTION_INFO = {

  live: {
    title: "📺 باقات القنوات المباشرة",
    help: "قم بإظهار أو إخفاء باقات LIVE",
    search: "ابحث في باقات القنوات..."
  },

  movies: {
    title: "🎬 باقات الأفلام",
    help: "قم بإظهار أو إخفاء باقات MOVIES",
    search: "ابحث في باقات الأفلام..."
  },

  series: {
    title: "📚 باقات المسلسلات",
    help: "قم بإظهار أو إخفاء باقات SERIES",
    search: "ابحث في باقات المسلسلات..."
  }

};


// ==========================================================
// MESSAGE
// ==========================================================

function msg(
  element,
  text,
  ok = false
) {

  if (!element) return;

  element.textContent =
    text || "";

  element.classList.toggle(
    "ok",
    !!ok
  );
}


// ==========================================================
// API
// ==========================================================

async function api(
  path,
  body
) {

  const response =
    await fetch(
      CONFIG.API_BASE + path,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(body)
      }
    );


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if (!response.ok) {

    throw new Error(
      data.error ||
      "حدث خطأ في الاتصال"
    );
  }


  return data;
}


// ==========================================================
// STATS
// ==========================================================

function updateStats() {

  $("#allCount").textContent =
    groups.length;


  const hidden =
    groups.filter(
      group =>
        group.hidden
    ).length;


  $("#hiddenCount").textContent =
    hidden;


  $("#visibleCount").textContent =
    groups.length - hidden;
}


// ==========================================================
// HTML ESCAPE
// ==========================================================

function escapeHtml(value) {

  return String(value)
    .replace(
      /[&<>"']/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char])
    );
}


// ==========================================================
// RENDER GROUPS
// ==========================================================

function render() {

  const search =
    $("#searchInput")
      .value
      .trim()
      .toLowerCase();


  const list =
    $("#groupsList");


  list.innerHTML = "";


  groups.forEach(
    group => {

      if (
        search &&
        !group.name
          .toLowerCase()
          .includes(search)
      ) {
        return;
      }


      const element =
        document.createElement(
          "div"
        );


      element.className =
        "group";


      element.draggable =
        !search;


      element.dataset.id =
        group.id;


      element.innerHTML = `

        <span
          class="handle"
          title="اسحب لتغيير الترتيب"
        >
          ☰
        </span>

        <div class="group-name">

          ${escapeHtml(group.name)}

          <span class="group-id">
            ID: ${escapeHtml(group.id)}
          </span>

        </div>

        <label
          class="switch"
          title="${group.hidden ? "مخفي" : "ظاهر"}"
        >

          <input
            type="checkbox"
            ${group.hidden ? "" : "checked"}
          >

          <span class="slider"></span>

        </label>

      `;


      const checkbox =
        element.querySelector(
          "input"
        );


      checkbox.addEventListener(
        "change",
        event => {

          group.hidden =
            !event.target.checked;

          updateStats();

        }
      );


      if (!search) {

        element.addEventListener(
          "dragstart",
          () => {

            element.classList.add(
              "dragging"
            );

          }
        );


        element.addEventListener(
          "dragend",
          () => {

            element.classList.remove(
              "dragging"
            );

            syncOrderFromDom();

          }
        );

      }


      list.appendChild(
        element
      );
    }
  );


  updateStats();
}


// ==========================================================
// DRAG ORDER
// ==========================================================

function syncOrderFromDom() {

  const search =
    $("#searchInput")
      .value
      .trim();


  if (search) {
    return;
  }


  const ids =
    [
      ...document.querySelectorAll(
        "#groupsList .group"
      )
    ].map(
      element =>
        element.dataset.id
    );


  if (
    ids.length !==
    groups.length
  ) {
    return;
  }


  const orderMap =
    new Map(
      ids.map(
        (id, index) => [
          id,
          index
        ]
      )
    );


  groups.sort(
    (a, b) =>

      orderMap.get(a.id) -
      orderMap.get(b.id)
  );


  sectionCache[currentType] =
    cloneGroups(groups);
}


$("#groupsList")
  .addEventListener(
    "dragover",
    event => {

      event.preventDefault();


      if (
        $("#searchInput")
          .value
          .trim()
      ) {
        return;
      }


      const container =
        $("#groupsList");


      const dragging =
        $(".dragging");


      if (!dragging) {
        return;
      }


      const after =
        [
          ...container
            .querySelectorAll(
              ".group:not(.dragging)"
            )
        ].find(
          element => {

            const box =
              element.getBoundingClientRect();


            return (
              event.clientY <
              box.top +
              box.height / 2
            );

          }
        );


      if (after) {

        container.insertBefore(
          dragging,
          after
        );

      } else {

        container.appendChild(
          dragging
        );
      }
    }
  );


// ==========================================================
// CLONE
// ==========================================================

function cloneGroups(list) {

  return list.map(
    group => ({
      ...group
    })
  );
}


// ==========================================================
// SECTION UI
// ==========================================================

function updateSectionUI() {

  const info =
    SECTION_INFO[currentType];


  $("#currentSectionTitle")
    .textContent =
      info.title;


  $("#currentSectionHelp")
    .textContent =
      info.help;


  $("#searchInput")
    .placeholder =
      info.search;


  $$(".section-tab")
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.type ===
            currentType
        );

      }
    );
}


// ==========================================================
// LOADING
// ==========================================================

function showGroupsLoading() {

  $("#groupsList")
    .innerHTML = `

      <div class="groups-loading">

        <div class="mini-spinner"></div>

        جارٍ تحميل الباقات...

      </div>

    `;
}


// ==========================================================
// LOAD GROUPS
// ==========================================================

async function loadGroups(
  type = currentType,
  force = false
) {

  if (
    !creds ||
    loadingGroups
  ) {
    return;
  }


  currentType =
    type;


  updateSectionUI();


  $("#searchInput").value =
    "";


  msg(
    $("#saveMsg"),
    ""
  );


  // استخدام Cache
  if (
    !force &&
    sectionCache[type]
  ) {

    groups =
      cloneGroups(
        sectionCache[type]
      );


    defaults =
      cloneGroups(
        sectionDefaults[type] || []
      );


    showManager();

    render();

    return;
  }


  loadingGroups =
    true;


  showGroupsLoading();


  try {

    const data =
      await api(
        "/api/groups",
        {
          ...creds,
          type
        }
      );


    groups =
      Array.isArray(data.groups)
        ? data.groups.map(
            group => ({
              id: String(group.id),
              name: String(group.name),
              hidden: !!group.hidden
            })
          )
        : [];


    defaults =
      Array.isArray(
        data.default_groups
      )
        ? data.default_groups.map(
            group => ({
              id: String(group.id),
              name: String(group.name),
              hidden: false
            })
          )
        : [];


    sectionCache[type] =
      cloneGroups(groups);


    sectionDefaults[type] =
      cloneGroups(defaults);


    showManager();

    render();

  }

  catch (error) {

    if (
      !$("#loginView")
        .classList
        .contains("hidden")
    ) {

      msg(
        $("#loginMsg"),
        error.message
      );

    } else {

      msg(
        $("#saveMsg"),
        error.message
      );
    }

  }

  finally {

    loadingGroups =
      false;

  }
}


// ==========================================================
// SHOW MANAGER
// ==========================================================

function showManager() {

  $("#loginView")
    .classList
    .add("hidden");


  $("#managerView")
    .classList
    .remove("hidden");


  $("#logoutBtn")
    .classList
    .remove("hidden");


  updateConnectionDetails();
}


// ==========================================================
// LOGIN
// ==========================================================

$("#loginForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      msg(
        $("#loginMsg"),
        "جارٍ التحقق..."
      );


      const username =
        $("#username")
          .value
          .trim();


      const password =
        $("#password")
          .value;


      try {

        await api(
          "/api/login",
          {
            username,
            password
          }
        );


        creds = {
          username,
          password
        };


        sessionStorage.setItem(
          "family_creds",
          JSON.stringify(
            creds
          )
        );


        currentType =
          "live";


        clearSectionCache();


        await loadGroups(
          "live",
          true
        );

      }

      catch (error) {

        msg(
          $("#loginMsg"),
          error.message
        );
      }

    }
  );


// ==========================================================
// SECTION TABS
// ==========================================================

$$(".section-tab")
  .forEach(
    button => {

      button.addEventListener(
        "click",
        async () => {

          const type =
            button.dataset.type;


          if (
            !type ||
            type === currentType ||
            loadingGroups
          ) {
            return;
          }


          // حفظ آخر حالة محلياً
          sectionCache[currentType] =
            cloneGroups(groups);


          await loadGroups(
            type
          );

        }
      );

    }
  );


// ==========================================================
// SAVE
// ==========================================================

$("#saveBtn")
  .addEventListener(
    "click",
    async () => {

      msg(
        $("#saveMsg"),
        "جارٍ الحفظ..."
      );


      try {

        await api(
          "/api/preferences/save",
          {
            ...creds,

            type:
              currentType,

            hidden_ids:
              groups
                .filter(
                  group =>
                    group.hidden
                )
                .map(
                  group =>
                    group.id
                ),

            category_order:
              groups.map(
                group =>
                  group.id
              )
          }
        );


        sectionCache[currentType] =
          cloneGroups(groups);


        msg(
          $("#saveMsg"),
          "تم حفظ تغييرات " +
          getSectionArabicName(
            currentType
          ) +
          " بنجاح ✓",
          true
        );

      }

      catch (error) {

        msg(
          $("#saveMsg"),
          error.message
        );
      }

    }
  );


// ==========================================================
// SHOW ALL
// ==========================================================

$("#showAllBtn")
  .addEventListener(
    "click",
    () => {

      groups.forEach(
        group => {

          group.hidden =
            false;

        }
      );


      sectionCache[currentType] =
        cloneGroups(groups);


      render();

    }
  );


// ==========================================================
// RESET
// ==========================================================

$("#resetBtn")
  .addEventListener(
    "click",
    () => {

      groups =
        defaults.map(
          group => ({
            ...group,
            hidden: false
          })
        );


      sectionCache[currentType] =
        cloneGroups(groups);


      render();

    }
  );


// ==========================================================
// SEARCH
// ==========================================================

$("#searchInput")
  .addEventListener(
    "input",
    render
  );


// ==========================================================
// LOGOUT
// ==========================================================

$("#logoutBtn")
  .addEventListener(
    "click",
    () => {

      sessionStorage.removeItem(
        "family_creds"
      );


      creds = null;


      clearSectionCache();


      location.reload();

    }
  );


// ==========================================================
// SECTION NAME
// ==========================================================

function getSectionArabicName(
  type
) {

  if (type === "movies") {
    return "باقات الأفلام";
  }


  if (type === "series") {
    return "باقات المسلسلات";
  }


  return "باقات القنوات";
}


// ==========================================================
// CLEAR CACHE
// ==========================================================

function clearSectionCache() {

  sectionCache.live =
    null;

  sectionCache.movies =
    null;

  sectionCache.series =
    null;


  sectionDefaults.live =
    null;

  sectionDefaults.movies =
    null;

  sectionDefaults.series =
    null;
}


// ==========================================================
// CONNECTION DETAILS
// ==========================================================

function updateConnectionDetails() {

  if (!creds) {
    return;
  }


  const host =
    CONFIG.API_BASE.replace(
      /\/$/,
      ""
    );


  const m3u =
    host +
    "/get.php" +
    "?username=" +
    encodeURIComponent(
      creds.username
    ) +
    "&password=" +
    encodeURIComponent(
      creds.password
    ) +
    "&type=m3u_plus&output=ts";


  const m3uField =
    $("#m3uLink");


  const hostField =
    $("#xtreamHost");


  const usernameField =
    $("#xtreamUsername");


  const passwordField =
    $("#xtreamPassword");


  if (m3uField) {
    m3uField.value =
      m3u;
  }


  if (hostField) {
    hostField.value =
      host;
  }


  if (usernameField) {
    usernameField.value =
      creds.username;
  }


  if (passwordField) {
    passwordField.value =
      creds.password;
  }


  const proxyHint =
    $("#proxyHint");


  if (proxyHint) {

    proxyHint.textContent =
      m3u;

  }
}


// ==========================================================
// COPY SINGLE FIELD
// ==========================================================

$$("[data-copy]")
  .forEach(
    button => {

      button.addEventListener(
        "click",
        async () => {

          const field =
            document.getElementById(
              button.dataset.copy
            );


          if (
            !field ||
            !field.value
          ) {
            return;
          }


          await copyText(
            field.value
          );


          copiedButton(
            button
          );

        }
      );

    }
  );


// ==========================================================
// COPY ALL XTREAM
// ==========================================================

$("#copyAllXtreamBtn")
  ?.addEventListener(
    "click",
    async function () {

      if (!creds) {
        return;
      }


      const text =
`Host: ${CONFIG.API_BASE}
Username: ${creds.username}
Password: ${creds.password}`;


      await copyText(
        text
      );


      copiedButton(
        this,
        "تم نسخ البيانات ✓"
      );

    }
  );


// ==========================================================
// COPY
// ==========================================================

async function copyText(
  text
) {

  try {

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {

      await navigator.clipboard
        .writeText(text);

      return;
    }

  }

  catch {}


  const textarea =
    document.createElement(
      "textarea"
    );


  textarea.value =
    text;


  textarea.style.position =
    "fixed";


  textarea.style.opacity =
    "0";


  document.body.appendChild(
    textarea
  );


  textarea.select();


  document.execCommand(
    "copy"
  );


  textarea.remove();
}


// ==========================================================
// COPY BUTTON STATUS
// ==========================================================

function copiedButton(
  button,
  text = "تم النسخ ✓"
) {

  const original =
    button.textContent;


  button.textContent =
    text;


  button.classList.add(
    "copied"
  );


  setTimeout(
    () => {

      button.textContent =
        original;


      button.classList.remove(
        "copied"
      );

    },
    1500
  );
}


// ==========================================================
// RESTORE SESSION
// ==========================================================

try {

  const saved =
    JSON.parse(
      sessionStorage.getItem(
        "family_creds"
      ) || "null"
    );


  if (
    saved?.username &&
    saved?.password
  ) {

    creds =
      saved;


    currentType =
      "live";


    loadGroups(
      "live",
      true
    );

  }

}

catch {

  sessionStorage.removeItem(
    "family_creds"
  );

}
