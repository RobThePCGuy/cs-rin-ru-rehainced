// ==UserScript==
// @name            CS.RIN.RU - RehAInced
// @namespace       RobThePCGuy
// @version         2.0
// @description     Enhance CS.RIN.RU
// @author          RobThePCGuy
// @match           *://cs.rin.ru/forum/*
// @match           *://csrinrutkb3tshptdctl5lyei4et35itl22qvk5ktdcat6aeavy6nhid.onion/forum/*
// @require         https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @icon            https://i.ibb.co/p1k6cq6/image.png
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_notification
// @grant           GM_addElement
// @run-at          document-idle
// @homepageURL     https://github.com/RobThePCGuy/cs-rin-ru-rehainced
// @supportURL      https://cs.rin.ru/forum/viewtopic.php?f=14&t=75717
// @updateURL       https://raw.githubusercontent.com/RobThePCGuy/cs-rin-ru-rehainced/master/cs-rin-ru-rehainced.user.js
// @downloadURL     https://raw.githubusercontent.com/RobThePCGuy/cs-rin-ru-rehainced/master/cs-rin-ru-rehainced.user.js

// ==/UserScript==

const BRANCH = "master";
const CONFIG_PAGE_CSS = `https://raw.githubusercontent.com/RobThePCGuy/cs-rin-ru-rehainced/${BRANCH}/config.css`;
const CONFIG_PAGE_JS = `https://raw.githubusercontent.com/RobThePCGuy/cs-rin-ru-rehainced/${BRANCH}/config.js`;
const CONFIG_PAGE = `https://raw.githubusercontent.com/RobThePCGuy/cs-rin-ru-rehainced/${BRANCH}/config.html`;

const AJAX_LOADER = `
<div style="margin-left: 50%;">
    <img
        id="ajaxload"
        src="https://raw.githubusercontent.com/RobThePCGuy/cs-rin-ru-rehainced/master/loading.gif"
        style="opacity: 0.5; position: fixed; width: 40px; height: 40px; z-index: 2147483647; display: none;"  alt="Loading"/>
</div>`;

const FORUM_NAME = 'CS.RIN.RU - Steam Underground Community';
const navBarSize = "1.0em";
const FRIENDS_LIST = [];

function getBaseUrl() {
    const path = window.location.origin + window.location.pathname;
    return path.slice(0, path.lastIndexOf('/') + 1) || 'https://cs.rin.ru/forum/';
}

const FORUM_BASE_URL = getBaseUrl();
const CONNECTED = $("#menubar > table:nth-child(3) > tbody > tr > td:nth-child(2) > a:last-child").attr("href").includes("mode=login") === false;
const USERNAME = CONNECTED ? $("#menubar > table:nth-child(3) > tbody > tr > td:nth-child(2) > a:nth-child(2)").text().slice(10, -2) : null;

async function retrievesFriendsLists() {
    if (!CONNECTED) return [];
    const friendsList = [];
    try {
        const response = await fetch(FORUM_BASE_URL + "ucp.php?i=zebra&mode=friends");
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");
        const friendsListContainer = doc.querySelector('#ucp > table > tbody > tr:nth-child(3) > td.row2 > select');
        if (friendsListContainer) {
            friendsList.push(...Array.from(friendsListContainer.children, node => node.innerText));
        }
    } catch (error) {
        console.error("Error retrieving friends list:", error);
    }
    return friendsList;
}

/*
Configuration array with default values.
*/
let specialSearchParameters = {
    "searchTermsSpecificity": "any",
    "searchSubforums": true,
    "sortResultsBy": "t",
    "sortOrderBy": "d",
    "searchTopicLocation": "titleonly",
    "showResultsAsPosts": false,
    "limitToPrevious": 0,
    "returnFirst": "300",
    "showFriends": true
};

let options = {
    "script_enabled": true,
    "infinite_scrolling": true,
    "mentioning": 1,
    "steam_db_link": true,
    "copy_link_button": true,
    "dynamic_function": true,
    "add_profile_button": true,
    "colorize_new_messages": true,
    "colorize_the_page": true,
    "display_ajax_loader": true,
    "custom_tags": true,
    "add_small_shoutbox": true,
    "add_users_tag": true,
    "show_all_spoilers": false,
    "add_link_quote": true,
    "quick_reply": true,
    "collapse_quotes": false,
    "colorize_friends_me": 3,
    "change_topic_link": 0,
    "topic_preview": false,
    "topic_preview_option": 0,
    "topic_preview_timeout": 5,
    "post_preview": false,
    "profile_preview": false,
    "special_search": true,
    "special_search_parameter": specialSearchParameters,
    "hide_scs": 0,
    "apply_in_scs": false,
    "title_format": "%C %S - %T"
};

/*
Color used in this script
*/
let color = {
    "color_of_friends": '#f4169b', "color_of_me": '#ff4c4c'
};

/*
Functions that need to be connected must be added here and you must also add the need-connected="true" tag to them.
*/
function loadConfig() {
    const savedOptions = GM_getValue("options", options);
    options = { ...options, ...savedOptions };
    if (!CONNECTED) {
        options.dynamic_function = false;
        options.add_profile_button = false;
        options.colorize_new_messages = false;
        options.add_small_shoutbox = false;
        options.colorize_friends_me = 0;
        options.add_link_quote = false;
        options.special_search_parameter.showFriends = false;
    }
}

loadConfig();

window.addEventListener("message", receiveConfigMessage, false);

function receiveConfigMessage(event) {
    if (!event.data || event.data.script_enabled === undefined) return;
    options = event.data;
    GM_setValue("options", options);
    GM_notification("Configuration saved", "Info");
}

function loadConfigButton() {
    const loadResource = (url, type, target) => {
        GM_xmlhttpRequest({
            url: url,
            onerror: (r) => {
                console.error(`Error loading ${type} resource: ${url}`, r);
                GM_notification(`Error loading ${type} resource: ${url}`, "Error");
            },
            onload: (r) => {
                const element = document.createElement(type);
                element.textContent = r.responseText;
                $(target).append(element);
                if (type === 'html') {
                    applyConfigValues();
                }
            }
        });
    };

    loadResource(CONFIG_PAGE_JS, 'script', 'body');
    loadResource(CONFIG_PAGE_CSS, 'style', 'body');
    loadResource(CONFIG_PAGE, 'html', 'body');

    // MutationObserver setup
    const observer = new MutationObserver(function (mutationsList, observer) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                if ($("input#script_enabled")[0]) {
                    applyConfigValues();
                    observer.disconnect();
                    return;
                }
            }
        }
    });

    // Start observing the body for child node additions
    observer.observe(document.body, { childList: true, subtree: false });

    function applyConfigValues() {
        if (!$("input#script_enabled")[0]) {
            console.warn("Config HTML elements not found even after MutationObserver triggered. Configuration settings might not be applied.");
            return;
        }

        $("input#script_enabled")[0].checked = options.script_enabled;
        $("input#infinite_scrolling")[0].checked = options.infinite_scrolling;
        $("select#mentioning")[0].options.selectedIndex = options.mentioning;
        $("input#steam_db_link")[0].checked = options.steam_db_link;
        $("input#copy_link_button")[0].checked = options.copy_link_button;
        $("input#dynamic_function")[0].checked = options.dynamic_function;
        $("select#colorize_friends_me")[0].options.selectedIndex = options.colorize_friends_me;
        $("input#add_profile_button")[0].checked = options.add_profile_button;
        $("input#colorize_new_messages")[0].checked = options.colorize_new_messages;
        $("input#colorize_the_page")[0].checked = options.colorize_the_page;
        $("input#display_ajax_loader")[0].checked = options.display_ajax_loader;
        $("input#custom_tags")[0].checked = options.custom_tags;
        $("input#add_small_shoutbox")[0].checked = options.add_small_shoutbox;
        $("input#add_users_tag")[0].checked = options.add_users_tag;
        $("input#show_all_spoilers")[0].checked = options.show_all_spoilers;
        $("input#add_link_quote")[0].checked = options.add_link_quote;
        $("input#quick_reply")[0].checked = options.quick_reply;
        $("input#collapse_quotes")[0].checked = options.collapse_quotes;
        $("select#hide_scs")[0].options.selectedIndex = options.hide_scs;
        $("input#apply_in_scs")[0].checked = options.apply_in_scs;
        $("input#title_format")[0].value = options.title_format;
        $("input#topic_preview")[0].checked = options.topic_preview;
        $("select#topic_preview_option")[0].options.selectedIndex = options.topic_preview_option;
        $("input#topic_preview_timeout")[0].value = options.topic_preview_timeout;
        $("input#post_preview")[0].checked = options.post_preview;
        $("input#profile_preview")[0].checked = options.profile_preview;
        $("input#special_search")[0].checked = options.special_search;
        $("select#change_topic_link")[0].options.selectedIndex = options.change_topic_link;
        const specialSearchParametersJSON = options.special_search_parameter;
        $("select#searchTermsSpecificity")[0].value = specialSearchParametersJSON.searchTermsSpecificity;
        $("input#searchSubforums")[0].checked = specialSearchParametersJSON.searchSubforums;
        $("select#searchTopicLocation")[0].value = specialSearchParametersJSON.searchTopicLocation;
        $("select#sortResultsBy")[0].value = specialSearchParametersJSON.sortResultsBy;
        $("select#sortOrderBy")[0].value = specialSearchParametersJSON.sortOrderBy;
        $("input#showResultsAsPosts")[0].checked = specialSearchParametersJSON.showResultsAsPosts;
        $("input#limitToPrevious")[0].value = specialSearchParametersJSON.limitToPrevious;
        $("input#returnFirst")[0].value = specialSearchParametersJSON.returnFirst;
        $("input#showFriends")[0].checked = specialSearchParametersJSON.showFriends;

        if (!options.script_enabled) {
            $("fieldset#config").hide();
        }
    }
}

loadConfigButton();

if (!options.script_enabled) return;

// Quick reply panel - Moved closer to usage
const quickReplyPanel = document.getElementById("postform");

// Navigation bar
let navBar = $("[title='Click to jump to page…']").parent().parent().first()[0];
if (navBar) {
    const div = document.createElement("div");
    div.className = "gensmall";
    div.name = "page_nav";
    div.width = "500";
    div.innerHTML = navBar.innerHTML;
    navBar.parentNode.replaceChild(div, navBar);
    const ancestor = $(div).closest("#pagecontent, #pageheader");
    if (ancestor.length) {
        $("#pagecontent").before(div);
    } else {
        $("[method='post']:not(#search)").first().before(div);
    }

    let bgColour = getComputedStyle(document.body).backgroundColor;
    let matches = bgColour.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    const bgRgb = matches ? [parseInt(matches[1]), parseInt(matches[2]), parseInt(matches[3])] : [255, 255, 255];
    const colour = bgRgb.reduce((a, b) => a + b, 0) > 600 ? "white" : "black";

    GM_addStyle(`[name="page_nav"] {
        position: sticky !important;
        top: 0px;
        width: 500px;
        background: linear-gradient(90deg, ${colour} 90%, transparent 95%);
    }`);
}

if (options.display_ajax_loader) {
    $("body").prepend(AJAX_LOADER);
    $(document).ajaxSend(() => {
        $("#ajaxload").show();
    });
    $(document).ajaxComplete(() => {
        $("#ajaxload").hide();
    });
}

if (options.infinite_scrolling && $("[title='Click to jump to page…']").length > 0) {
    const styleElement = document.querySelector("style");
    if (styleElement) styleElement.textContent = "[name=\"page_nav\"] {font-size:" + navBarSize + ";}";
    const selectors = [
        "#pagecontent > table.tablebg > tbody > tr:has(.row4 > img:not([src*=global], [src*=announce], [src*=sticky]))",
        "#wrapcentre > form > table.tablebg > tbody > tr[valign='middle']",
        "#pagecontent > .tablebg:not(:has(tbody > tr > .cat))",
        "#wrapcentre > form > table.tablebg > tbody > tr:not(:has(.cat)):not(:first)",
        "#pagecontent > form > table.tablebg > tbody > tr:not(:first)"
    ];

    const selector = selectors.find(select => $(select).length);
    if (!selector) return;

    let ajaxDone = true;
    const navElem = $("[title='Click to jump to page…']").first().parent();
    const initialPageElem = navElem.find("strong");
    let scrollLength = 0;
    const scrollThreshold = 1000;
    let navElems = {};
    navElems[initialPageElem.text()] = { Html: navElem.html() };

    if (URLContains("viewtopic.php")) {
        if (initialPageElem.next().next().length) {
            $("[title='Subscribe topic']").first().parents().eq(7).after($(".cat:has(.btnlite)").first().parent().parent().parent());
            $("[title='Reply to topic']").last().parents().eq(4).remove();
        }
    } else if (!URLContains("ucp.php")) {
        $(selector).parent().prepend($(".cat:has(.btnlite)").parent());
    }

    $(selector).attr("page_number", initialPageElem.text());

    function infiniteScroll(e) {
        if (!ajaxDone) return;

        const posts = [...$(selector)];
        const topElement = posts.find(post => post.getBoundingClientRect().top >= 0 && window.getComputedStyle(post).display !== "none");
        let currentPageNumber = navElem.find("strong").text();

        if (topElement) {
            currentPageNumber = $(topElement).attr("page_number");
            navElem.html(navElems[currentPageNumber]?.Html || navElem.html());
            // Update number next to "post reply" button in topics
            if (URLContains("viewtopic.php")) {
                const pageIndicator = document.getElementsByClassName("nav")[0];
                if (pageIndicator) pageIndicator.querySelector("strong:nth-child(1)").textContent = currentPageNumber;
            }
        }

        const navElemsKeys = Object.keys(navElems).map(Number);
        let earliestPageNumber = Math.min(...navElemsKeys).toString();
        let latestPageNumber = Math.max(...navElemsKeys).toString();

        if ((window.scrollY || document.documentElement.scrollTop) === 0 && e.deltaY < 0) {
            scrollLength += Math.abs(e.deltaY);
            if (scrollLength >= scrollThreshold && currentPageNumber === earliestPageNumber) {
                ajaxDone = false;
                const previousPageElem = navElem.find(`:contains('${earliestPageNumber}')`).first().prev().prev();
                const previousPageLink = previousPageElem.attr("href");

                if (!previousPageLink) {
                    ajaxDone = true;
                    return;
                }

                $.get(previousPageLink, function (data) {
                    const currentPage = $(selector);
                    const newPageContent = $(selector, data).attr("page_number", previousPageElem.text());
                    newPageContent.find("tbody:first tr:first").remove();
                    currentPage.first().before(newPageContent);
                    const scrollPosition = currentPage.first().offset().top + currentPage.first().height() - window.innerHeight;
                    $("html, body").animate({ scrollTop: scrollPosition }, 0);
                    const prevNavElemHTML = $("[title='Click to jump to page…']", data).first().parent().html();
                    navElems[previousPageElem.text()] = { Html: prevNavElemHTML };
                    functionsCalledByInfiniteScrolls(data);
                    earliestPageNumber = $($.parseHTML(prevNavElemHTML)).find("strong").text();
                    ajaxDone = true;
                }).fail(() => { ajaxDone = true; });
                scrollLength = 0;
            }
        } else {
            scrollLength = 0;
        }

        if (window.innerHeight + window.scrollY + 1500 >= document.body.scrollHeight && currentPageNumber === latestPageNumber) {
            ajaxDone = false;
            const nextPageElem = navElem.find(`:contains('${latestPageNumber}')`).next().next();
            const nextPageLink = nextPageElem.attr("href");

            if (!nextPageLink) {
                if (!document.querySelector("#pagecontent > table:last-child > tbody > tr > td > a > img") && !URLContains("ucp.php")) {
                    const originalElement = document.querySelector("#pagecontent > table:nth-child(1)");
                    if (originalElement) {
                        const copiedElement = originalElement.cloneNode(true);
                        document.querySelector("#pagecontent").appendChild(copiedElement);
                        //Retrieve the correct nav
                        const element = document.getElementsByClassName("nav")[3];
                        if (element) element.querySelector('strong:nth-child(1)').textContent = element.querySelector('strong:nth-child(2)').textContent; // Check if element exists
                    }
                }
                ajaxDone = true;
                return;
            }

            $.get(nextPageLink, function (data) {
                const newPage = $(selector, data).attr("page_number", nextPageElem.text());
                newPage.find("tbody:first tr:first").remove();
                $(selector).last().after(newPage);
                const nextNavElemHTML = $("[title='Click to jump to page…']", data).first().parent().html();
                navElems[nextPageElem.text()] = { Html: nextNavElemHTML };
                functionsCalledByInfiniteScrolls(data);
                const parsedNav = $.parseHTML(nextNavElemHTML);
                const strongElem = $(parsedNav).find("strong").text();
                if (strongElem) latestPageNumber = strongElem;
                ajaxDone = true;
            }).fail(() => { ajaxDone = true; });
        }
    }

    window.addEventListener("wheel", infiniteScroll, { passive: false });
    window.addEventListener("scroll", infiniteScroll, { passive: true });
}

function functionsCalledByInfiniteScrolls(data) {
    dynamicFunction(data);
    mentionify();
    quotify();
    tagify();
    hideScs();
    setupTopicPreview();
    setupPostPreview();
    setupProfilePreview();
    addLink();
    steamDBLink();
    addUsersTag();
    changeTopicLink();
    colorizeFriendsMe();
    showAllSpoilers();
    collapseQuotes();
}

// CUSTOM TAGS
tagify();
hideScs();

// MENTIONING
if (URLContains("posting.php" && "do=mention") && options.mentioning) {
    const p = URLParam("p");
    const u = URLParam("u");
    const a = URLParam("a");
    let postBody = `@[url=${FORUM_BASE_URL}memberlist.php?mode=viewprofile&u=${u}]${decodeURI(a)}[/url], `;
    if (options.mentioning === 2) {
        postBody += `Re: [url=${FORUM_BASE_URL}viewtopic.php?p=${p}#p${p}]Post[/url]. `;
    }
    $("[name=message]").val(postBody);
}
mentionify();

let intervalID; // Declare intervalID outside function scope for clearInterval

function allDynamicFunction() {
    if (options.dynamic_function) {
        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "visible") {
                dynamicFunction();
                startUpdating();
            } else {
                clearInterval(intervalID);
            }
        });
        if (document.visibilityState === "visible") {
            startUpdating();
        }
    }
}

allDynamicFunction();

function startUpdating() {
    if (!intervalID) { // Prevent multiple intervals
        intervalID = setInterval(dynamicFunction, 60000);
    }
}

function dynamicFunction(data) {
    const updateContent = (data) => {
        $("#datebar .gensmall+ .gensmall").html($("#datebar .gensmall+ .gensmall", data).html());
        $("#wrapcentre > .tablebg").last().html($("#wrapcentre > .tablebg", data).last().html());
        const messageIconHTML = $("#menubar > table:nth-child(3) > tbody > tr > td:nth-child(1) > a:nth-child(" + (2 + options.add_profile_button) + ")", data).html();
        if (messageIconHTML && $(messageIconHTML)[0]?.src.endsWith("theme/images/icon_mini_message.gif")) { // Check if messageIconHTML exists and has src
            $("#menubar > table:nth-child(3) > tbody > tr > td:nth-child(1) > a:nth-child(" + (2 + options.add_profile_button) + ")").html(messageIconHTML);
        }
        changeColorOfNewMessage();
        colorizeFriendsMe();
    };

    if (data) {
        updateContent(data);
    } else {
        $.get(location.href, updateContent); // Use callback for $.get
    }
}

// FUNCTIONS
function mentionify() {
    if ($(".postbody").length && URLContains("viewtopic.php") && options.mentioning >= 1 && document.querySelector('a[href^="./posting.php?mode=reply"] img') && !document.querySelector('a[href^="./posting.php?mode=reply"] img').alt.includes('locked')) { // More conditions combined and null check
        const replyLink = $("[title='Reply to topic']").parent().attr("href");
        $(".gensmall div+ div:not(:has([title='Reply with mentioning']))").each(function () {
            const $this = $(this); // Cache $(this)
            if ($this.has('[title="Reply with mentioning"]').length) return; // Skip if already has mention link
            const postElem = $this.closest('.row1, .row2').closest('tr'); // More robust selector for post element
            const postID = postElem.find("a[name]").attr("name")?.slice(1); // Optional chaining and null check
            const author = postElem.find(".postauthor").text();
            const authorID = postElem.find("[title=Profile]").parent().attr("href")?.split("u=")[1]; // Optional chaining and null check

            if (!postID || !authorID) return; // Skip if postID or authorID is missing

            const mentionLinkElement = $(`<a href='javascript:void(0);'>
                <img src="https://raw.githubusercontent.com/RobThePCGuy/cs-rin-ru-rehainced/master/mention-image.png"
                alt='Reply with mentioning' title='Reply with mentioning'>
            </a>`);

            $this.append(mentionLinkElement);

            mentionLinkElement.on("click", function () {
                let postBody = `@[url=${FORUM_BASE_URL}memberlist.php?mode=viewprofile&u=${authorID}]${decodeURI(author)}[/url], `;
                if (options.mentioning === 2) {
                    postBody += `Re: [url=${FORUM_BASE_URL}viewtopic.php?p=${postID}#p${postID}]Post[/url]. `;
                }
                $("[name=message]").val(function (_, val) { return val + postBody }); // Use function to append to existing value
                const mentioned = $('<span class="mentioned">Mentioned!</span>').css({ // Inline CSS for brevity
                    'position': 'absolute',
                    'top': mentionLinkElement.offset().top - 20 - 22, // Use calculated height 22px
                    'left': mentionLinkElement.offset().left + (mentionLinkElement.outerWidth() / 2) - 12 - 30 // Use calculated width 30px
                });
                $('body').append(mentioned);
                setTimeout(() => mentioned.fadeOut(500, () => mentioned.remove()), 2000); // FadeOut with callback for removal
            });
        });
    }
}

function tagify() {
    if (options.custom_tags) {
        $(".titles, .topictitle").each(function () {
            if (this.id === "colorize") return; // Skip if already colorized
            this.id = "colorize";
            const titleElem = $(this); // Cache $(this)
            const parentElem = this.parentElement;
            const text = titleElem.text();
            const tags = text.match(/\[([^\]]+)]/g);
            if (tags) {
                let newHTML = text;
                tags.forEach(tag => {
                    const color = colorize(tag, parentElem);
                    const tagSpan = `<span style='color:${color};'>[</span><span style='color:${color};font-size: 0.9em;'>${tag.replace(/[\[\]]/g, "")}</span><span style='color:${color};'>]</span>`;
                    newHTML = newHTML.replace(tag, tagSpan);
                });
                titleElem.html(newHTML);
            }
        });
    }
}

// 0=not hide, 1=hide all, 2=hide only green, 3=show only red
function hideScs() {
    if (options.hide_scs > 0 && (options.apply_in_scs || $("a.titles").text() !== "Steam Content Sharing")) {
        let regex;
        switch (options.hide_scs) {
            case 1: regex = /topic_tags\/scs_/; break;
            case 2: regex = /topic_tags\/scs_on/; break;
            case 3: regex = /topic_tags\/scs_[oy][^f]/; break;
            default: return; // Exit if invalid option
        }
        $(".topictitle img").each(function () {
            if (this.src.match(regex)) {
                this.closest('tr').style.display = "none"; // Use closest('tr') for efficiency
            }
        });
    }
}

function hexToRgb(hex) {
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

function colorize(str, parentElem) {
    let lstr = str.toLowerCase();
    let hash = 0;
    for (let i = 0; i < lstr.length; i++) {
        hash = lstr.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colorHex = Math.floor(Math.abs((Math.sin(hash) * 10000) % 1 * 16777216)).toString(16);
    let rgb = hexToRgb(colorHex);

    let currentElem = parentElem; // Rename for clarity
    let bgRgb = [255, 255, 255]; // Default white if no bg color found
    while (currentElem && !getComputedStyle(currentElem).backgroundColor.startsWith('rgb')) { // More robust bg check
        currentElem = currentElem.parentElement;
    }
    if (currentElem) {
        let bgColour = getComputedStyle(currentElem).backgroundColor;
        let matches = bgColour.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (matches) bgRgb = [parseInt(matches[1]), parseInt(matches[2]), parseInt(matches[3])];
    }

    while (Math.abs(rgb.reduce((a, b) => a + b, 0) - bgRgb.reduce((a, b) => a + b, 0)) < 300) { // Use reduce for sums
        hash = (hash << 5) - hash;
        colorHex = Math.floor(Math.abs((Math.sin(hash) * 10000) % 1 * 16777216)).toString(16);
        rgb = hexToRgb(colorHex);
    }

    return '#' + colorHex.padStart(6, '0');
}

function URLContains(match) {
    return window.location.href.includes(match); // Use includes for better readability and performance
}

function URLParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) || ''; // Use URLSearchParams and handle null
}

function setupPageTitle() {
    const currentTitle = document.title;
    const parts = currentTitle.split("•");
    if (parts.length < 2) return; // Exit if title format is unexpected

    const cs = parts[0] + " •";
    const remainder = parts[1];
    const fullTitle = remainder.split(/[-•]/);
    let sectionTitle = "", pageTitle = "";

    if (fullTitle.length === 1) {
        pageTitle = $("a.titles").text() || fullTitle[0].trim();
    } else {
        sectionTitle = fullTitle[0].trim();
        pageTitle = $("a.titles").text() || fullTitle[1].trim();
    }
    const pageTitleWithoutTags = pageTitle.replace(/\[[^\]]*]/g, '');
    document.title = options.title_format
        .replace("%C", cs)
        .replace("%S", sectionTitle)
        .replace("%T", pageTitle)
        .replace("%RT", pageTitleWithoutTags);
}

setupPageTitle();

function previewElement(element, link, getIndex) {
    let tid, showPreview = false; // Initialize showPreview

    $(element).off("mouseover").on("mouseover", () => {
        showPreview = true;
        $("#topic_preview").hide();
        tid = setTimeout(() => {
            if (!showPreview) return;

            const previewWidth = window.innerWidth * 0.75;
            const previewHeight = window.innerHeight * 0.75;
            const x = (window.innerWidth - previewWidth) / 2; // Calculate center position
            const y = (window.innerHeight - previewHeight) / 2 + window.scrollY; // Calculate center position and add scrollY

            GM_xmlhttpRequest({
                url: link,
                onerror: (r) => {
                    console.error("Error loading preview page:", r); // More specific error message
                },
                onload: (r) => {
                    if (!showPreview) return;
                    const parser = new DOMParser();
                    const dom = parser.parseFromString(r.responseText, "text/html").body.children;
                    const posts = $(dom).find("div#pagecontent table.tablebg");
                    const index = getIndex(posts, link); // Get index first
                    if (index === -1 || !posts[index]) { // Check if index is valid and post exists
                        console.warn("Could not find post for preview at index:", index, "link:", link);
                        return; // Exit if post not found
                    }

                    const body = posts[index].outerHTML;
                    const bodyObj = parser.parseFromString(body, "text/html").body.children[0];

                    let tip = $("#topic_preview"); // Cache jQuery object
                    if (tip.length) {
                        tip.html(bodyObj).css({ left: `${x}px`, top: `${y}px`, width: `${previewWidth}px`, height: `${previewHeight}px` }).show().scrollTop(0); // Chained methods and inline CSS update
                    } else {
                        tip = $("<div>", { id: "topic_preview" }).append(bodyObj).css({ // Create div with jQuery for conciseness
                            position: "absolute", top: `${y}px`, left: `${x}px`, width: `${previewWidth}px`, maxWidth: `${previewWidth}px`, height: `${previewHeight}px`, maxHeight: `${previewHeight}px`, overflow: "auto"
                        }).appendTo("body"); // Append to body directly

                        tip.on("mouseleave", () => {
                            tip.hide();
                            clearTimeout(tid);
                            showPreview = false; // Ensure showPreview is reset
                        });
                    }
                    addUsersTag();
                    steamDBLink();
                }
            });
        }, options.topic_preview_timeout * 1000);
    });

    $(element).off("mouseleave").on("mouseleave", () => {
        clearTimeout(tid);
        showPreview = false; // Ensure showPreview is reset on mouseleave
    });
}

function setupTopicPreview() {
    if (!options.topic_preview) return;
    $("a.topictitle").each((_, e) => {
        const topic = e;
        const topicLink = topic.href.split("&view=unread")[0].split("&p=")[0];
        let link;
        let getIndex;

        switch (options.topic_preview_option) {
            case 0:
                link = topicLink;
                getIndex = () => 1; // First post index is usually 1 in context of `posts` array in previewElement
                break;
            case 1:
                link = topicLink + "&view=unread#unread";
                getIndex = () => 1; // Unread post could still be considered as first in the topic context
                break;
            case 2:
                const lastPostLink = $(topic).parent().next().next().next().next().find("a").eq(1).attr("href"); // More robust selector using .find() and .eq(1)
                link = lastPostLink;
                getIndex = (posts) => posts.length - 2; // Last post index is usually posts.length - 2
                break;
            default:
                console.warn("Invalid topic_preview_option:", options.topic_preview_option);
                return; // Exit if option is invalid
        }
        previewElement(topic, link, getIndex);
    });
}

setupTopicPreview();

function setupPostPreview() {
    if (!options.post_preview) return;
    $("a.postlink-local").each((_, e) => {
        const post = e;
        const link = post.href;
        if (!link.includes("viewtopic.php")) return;
        const getIndex = (posts, link) => {
            for (let i = 0; i < posts.length; i++) {
                const postLink = $(posts[i]).find("a[href*='viewtopic.php']:not([class])")[0];
                if (postLink?.href === link) { // Null check postLink before accessing href
                    return i;
                }
            }
            return -1;
        };
        previewElement(post, link, getIndex);
    });
}

setupPostPreview();

function setupProfilePreview() {
    if (!options.profile_preview) return;
    $("a.postlink-local").each((_, e) => {
        const profile = e;
        const link = profile.href;
        if (!link.includes("memberlist.php")) return;
        const getIndex = () => 0; // Profile preview usually starts at index 0

        previewElement(profile, link, getIndex);
    });
}

setupProfilePreview();

function addUsersTag() {
    if (options.add_users_tag) {
        const steamLink = $('a[href^="https://store.steampowered.com/app/"], a[href^="http://store.steampowered.com/app/"]').first()[0];
        if (steamLink) {
            const genreDescription = $(":contains('Genre(s):')").filter((i, e) => $(e).text() === "Genre(s):");
            if (genreDescription.length && genreDescription.next().next().text() !== "User-defined Tag(s): ") {
                const link = steamLink.href;
                GM_xmlhttpRequest({
                    method: "GET",
                    url: link,
                    onload: function (response) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, "text/html");
                        const tags = doc.querySelectorAll("#glanceCtnResponsiveRight > div.glance_tags_ctn.popular_tags_ctn > div.glance_tags.popular_tags > a.app_tag");
                        const genres = Array.from(tags).map(tag => tag.textContent.trim()).join(", ");
                        if (genreDescription.next().next().text() === "User-defined Tag(s): ") return;

                        const br = genreDescription.next()[0];
                        const span = document.createElement("span");
                        span.style.fontWeight = "bold";
                        span.textContent = "User-defined Tag(s): ";
                        const text = document.createTextNode(genres);

                        if (br && br.parentNode) { // Check if br and parentNode exist
                            br.parentNode.insertBefore(document.createElement("br"), br);
                            br.parentNode.insertBefore(span, br);
                            br.parentNode.insertBefore(text, br);
                        }
                    },
                    onerror: (error) => {
                        console.error("Error fetching Steam page for user tags:", error); // Error handling for AJAX
                    }
                });
            }
        }
    }
}

addUsersTag();

function steamDBLink() {
    if (!options.steam_db_link) return;

    $(".postlink").each(function () { // Use .each() for iteration
        let steamLink = this.href;
        if (steamLink.includes("://store.steampowered.com/app")) {
            steamLink = steamLink.replace(/\/$/, ''); // Remove trailing slash if present

            let splits = steamLink.split("/");
            let appId;
            if (splits[splits.length - 1].match(/^\d+$/)) {
                appId = splits[splits.length - 1];
            } else if (splits[splits.length - 2].match(/^\d+$/)) {
                appId = splits[splits.length - 2];
            } else {
                return; // Skip if no app ID found
            }

            const DBlink = `https://steamdb.info/app/${appId}/`;
            const $this = $(this); // Cache $(this)
            if (!$this.next().is("br") || !$this.next().next().is(`a[href="${DBlink}"]`)) { // Check if SteamDB link already exists
                $this.after("<br><span style=\"font-weight: bold\">  <svg version=\"1.1\" width=\"1.3em\" height=\"1.3em\" viewBox=\"0 0 128 128\" fill=#bbbbbb class=\"octicon octicon-steamdb\" aria-hidden=\"true\"><path fill-rule=\"evenodd\" d=\"M63.9 0C30.5 0 3.1 11.9.1 27.1l35.6 6.7c2.9-.9 6.2-1.3 9.6-1.3l16.7-10c-.2-2.5 1.3-5.1 4.7-7.2 4.8-3.1 12.3-4.8 19.9-4.8 5.2-.1 10.5.7 15 2.2 11.2 3.8 13.7 11.1 5.7 16.3-5.1 3.3-13.3 5-21.4 4.8l-22 7.9c-.2 1.6-1.3 3.1-3.4 4.5-5.9 3.8-17.4 4.7-25.6 1.9-3.6-1.2-6-3-7-4.8L2.5 38.4c2.3 3.6 6 6.9 10.8 9.8C5 53 0 59 0 65.5c0 6.4 4.8 12.3 12.9 17.1C4.8 87.3 0 93.2 0 99.6 0 115.3 28.6 128 64 128c35.3 0 64-12.7 64-28.4 0-6.4-4.8-12.3-12.9-17 8.1-4.8 12.9-10.7 12.9-17.1 0-6.5-5-12.6-13.4-17.4 8.3-5.1 13.3-11.4 13.3-18.2 0-16.5-28.7-29.9-64-29.9zm22.8 14.2c-5.2.1-10.2 1.2-13.4 3.3-5.5 3.6-3.8 8.5 3.8 11.1 7.6 2.6 18.1 1.8 23.6-1.8s3.8-8.5-3.8-11c-3.1-1-6.7-1.5-10.2-1.5zm.3 1.7c7.4 0 13.3 2.8 13.3 6.2 0 3.4-5.9 6.2-13.3 6.2s-13.3-2.8-13.3-6.2c0-3.4 5.9-6.2 13.3-6.2zM45.3 34.4c-1.6.1-3.1.2-4.6.4l9.1 1.7a10.8 5 0 1 1-8.1 9.3l-8.9-1.7c1 .9 2.4 1.7 4.3 2.4 6.4 2.2 15.4 1.5 20-1.5s3.2-7.2-3.2-9.3c-2.6-.9-5.7-1.3-8.6-1.3zM109 51v9.3c0 11-20.2 19.9-45 19.9-24.9 0-45-8.9-45-19.9v-9.2c11.5 5.3 27.4 8.6 44.9 8.6 17.6 0 33.6-3.3 45.2-8.7zm0 34.6v8.8c0 11-20.2 19.9-45 19.9-24.9 0-45-8.9-45-19.9v-8.8c11.6 5.1 27.4 8.2 45 8.2s33.5-3.1 45-8.2z\"></path></svg> SteamDB:</span> <a href=\"${DBlink}\" class=\"postlink\" rel=\"nofollow\">${DBlink}</a>");
            }
        }
    });
}

steamDBLink();

function addLink() {
    if (!options.copy_link_button || !$(".postbody").length || !URLContains("viewtopic.php")) return; // Early exit if not needed

    $(".gensmall div+ div:not(:has([title='Copy the link into the clipboard']))").each(function () {
        const $this = $(this); // Cache $(this)
        if ($this.has('[title="Copy the link into the clipboard"]').length) return; // Skip if already has copy link

        const postElem = $this.closest('.row1, .row2').closest('tr'); // More robust selector
        const postId = postElem.find("a[name]").attr("name")?.slice(1); // Optional chaining and null check

        if (!postId) return; // Skip if postId is missing

        const copyLinkElement = $(`<a href='javascript:void(0);'>
            <img src="https://raw.githubusercontent.com/RobThePCGuy/cs-rin-ru-rehainced/master/link-image.png"
            alt='Copy the link into the clipboard' title='Copy the link into the clipboard'>
        <a>`);
        $this.append(copyLinkElement);

        copyLinkElement.on("click", function () {
            const url = `${FORUM_BASE_URL}viewtopic.php?p=${postId}#p${postId}`;
            navigator.clipboard.writeText(url);
            const copied = $('<span class="copied">Copied!</span>').css({ // Inline CSS for brevity
                'position': 'absolute',
                'top': copyLinkElement.offset().top - 20 - 22, // Use calculated height 22px
                'left': copyLinkElement.offset().left + (copyLinkElement.outerWidth() / 2) - 12 - 30 // Use calculated width 30px
            });
            $('body').append(copied);
            setTimeout(() => copied.fadeOut(500, () => copied.remove()), 2000); // FadeOut with callback for removal
        });
    });
}

addLink();

function AddShoutbox() {
    if (options.add_small_shoutbox && !URLContains("chat.php")) {
        let button = document.createElement("button");
        button.textContent = "Show Chat";
        button.style.cssText = "position: fixed; bottom: 0%; right: 0%; min-height: 40px; min-width: 50px; width: 5%; height: 3%; z-index: 9999;";

        button.addEventListener("click", function () {
            const chatDiv = document.getElementById("chatDiv");
            if (!chatDiv) {
                button.textContent = "Hide Chat";
                createChatContainer();
                fetchChat();
                GM_setValue("chatActive", true);
            } else {
                chatDiv.remove();
                button.textContent = "Show Chat";
                GM_setValue("chatActive", false);
            }
        });

        document.addEventListener("visibilitychange", () => {
            const chatDiv = document.getElementById("chatDiv");
            if (chatDiv) {
                const script = chatDiv.children[1];
                if (document.hidden) {
                    script.setAttribute("data-original-text", script.textContent);
                    script.textContent = "";
                } else {
                    script.textContent = script.getAttribute("data-original-text") || ''; // Fallback in case attribute is missing
                    script.removeAttribute('data-original-text');
                }
            }
        });
        document.body.appendChild(button);
        if (GM_getValue("chatActive", false)) {
            button.click();
        }
    }
}

AddShoutbox();

function createChatContainer() {
    let chatContainer = document.createElement("div");
    chatContainer.id = "chatDiv";
    chatContainer.style.cssText = "position: fixed; bottom: 0%; right: 0%; width: 25%; min-width: 425px; height: 70%; overflow-y: auto; background-color:#1c1c1c; border:0.5em solid black";

    const loading = document.createTextNode("Loading...");
    const p = document.createElement("p");
    p.appendChild(loading);
    p.style.cssText = "position: absolute; left: 0; right: 0; top: 20%; transform: translateY(-50%); text-align: center; color: white; font-size: 500%;";
    chatContainer.appendChild(p);
    document.body.appendChild(chatContainer);
}

function fetchChat() {
    fetch(FORUM_BASE_URL + "chat.php")
        .then(response => response.text())
        .then(text => {
            const chatContainer = document.getElementById("chatDiv");
            if (!chatContainer) return; // Exit if chatContainer is removed in the meantime

            chatContainer.innerHTML = "";
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const originalScript = doc.querySelector("#wrapcentre > script");
            const chatElement = doc.querySelector("#wrapcentre > div > table > tbody");

            if (chatElement) chatContainer.appendChild(chatElement);
            chatContainer.style.backgroundColor = "#1c1c1c";

            if (originalScript) {
                const script = document.createElement("script");
                script.innerHTML = originalScript.innerHTML;
                chatContainer.appendChild(script);
            }
        })
        .then(colorizeFriendsMe) // Chain colorizeFriendsMe after chat is fetched and rendered
        .catch(error => console.error("Error fetching chat:", error)); // Error handling for fetch
}

function changeTopicLink() {
    const updateTopicLinks = (condition, linkModifier) => {
        if (options.change_topic_link === condition) {
            document.querySelectorAll(".titles:not(:first-child), .topictitle").forEach(element => {
                if (element.href) {
                    element.href = linkModifier(element.href);
                }
            });
        }
    };

    updateTopicLinks(1, href => href.includes("&view=unread#unread") ? href : href + "&view=unread#unread");
    updateTopicLinks(2, href => {
        if (href.includes("&p=")) return href; // Keep existing &p= links
        const lastPostLink = $(element).parent().next().next().next().next().find("a").eq(1).attr("href");
        return lastPostLink || href; // Fallback to original href if lastPostLink is not found
    });
}

changeTopicLink();

function addProfileButton() {
    if (!options.add_profile_button || !CONNECTED) return; // Early exit if not needed or not connected

    let profileLink = GM_getValue("profileLink", null);
    const updateProfileLink = (link) => {
        GM_setValue("profileLink", link);
        profileLink = link; // Update local variable
        createProfileButton(profileLink); // Create button after link is available
    };

    if (!profileLink) {
        if ($(`p.gensmall > :contains(${USERNAME})`).length) {
            updateProfileLink($(`p.gensmall > :contains(${USERNAME})`)[0].href);
        } else {
            GM_xmlhttpRequest({
                method: "GET",
                url: FORUM_BASE_URL + "viewforum.php?f=10",
                onload: function (response) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, "text/html");
                    const foundLink = $(doc).find(`p.gensmall > :contains(${USERNAME})`)[0]?.href; // Optional chaining
                    if (foundLink) updateProfileLink(foundLink);
                },
                onerror: (error) => {
                    console.error("Error fetching profile link:", error); // Error handling for AJAX
                }
            });
        }
    } else {
        createProfileButton(profileLink); // Create button if link is already cached
    }
}

function createProfileButton(profileLink) {
    const bar = $(".genmed")[2];
    if (!bar) return; // Exit if bar element not found

    const a = document.createElement("a");
    a.href = profileLink;
    const img = document.createElement("img");
    const iconSrc = $("#menubar > table:nth-child(3) > tbody > tr > td:nth-child(1) > a:nth-child(1) > img").attr('src'); // Get icon src dynamically
    if (iconSrc) {
        img.src = iconSrc;
        img.width = 12;
        img.height = 13;
    }
    a.appendChild(img);
    a.appendChild(document.createTextNode(" Profile"));
    const sep = document.createTextNode(` ${String.fromCharCode(160)}:: ${String.fromCharCode(160)}`);
    $(bar).find("a").eq(1).before(a, sep); // Use .eq(1) to target correct element
}

addProfileButton();

function changeColorOfNewMessage() {
    if (options.colorize_new_messages) {
        const menuBar = $("#menubar > table:nth-child(3) > tbody > tr > td:nth-child(1) > a:nth-child(" + (2 + options.add_profile_button) + ")")[0];
        if (menuBar) { // Check if menuBar exists
            if (!menuBar.text.startsWith(" 0 new messages")) {
                menuBar.style.color = "red";
            } else {
                menuBar.style.color = "#AAAAAA";
            }
        }
    }
}

changeColorOfNewMessage();

function colorizeThePages() {
    if (options.colorize_the_page) {
        $("#menubar > table:nth-child(1) > tbody > tr > td:nth-child(1) > a:nth-child(1)").css("color", "#FFA07A"); // Forum Rules
        $("#menubar > table:nth-child(1) > tbody > tr > td:nth-child(1) > a:nth-child(2)").css("color", "#FFC200"); // Donate
        $("#menubar > table:nth-child(1) > tbody > tr > td:nth-child(2) > a:nth-child(1)").css("color", "#98FB98"); // Chat
        $("#menubar > table:nth-child(1) > tbody > tr > td:nth-child(2) > a:nth-child(2)").css("color", "#90EE90"); // FAQ
        if (CONNECTED) $("#menubar > table:nth-child(1) > tbody > tr > td:nth-child(2) > a:nth-child(3)").css("color", "#4169E1"); // Members
        $("#menubar > table:nth-child(3) > tbody > tr > td:nth-child(1) > a:nth-child(1)").css("color", "#87CEEB"); // User Control Panel
        if (options.add_profile_button) $("#menubar > table:nth-child(3) > tbody > tr > td:nth-child(1) > a:nth-child(2)").css("color", "#F08080"); // Profile
        $("#menubar > table:nth-child(3) > tbody > tr > td:nth-child(2) > a:nth-child(1)").css("color", "#87CEFA"); // Search
        $("#menubar > table:nth-child(3) > tbody > tr > td:nth-child(2) > a:nth-child(2)").css("color", "#FF0000"); // Logout
        $("#logodesc > table > tbody > tr > td:nth-child(2) > h1").css("color", '#' + Math.floor(Math.random() * 16777215).toString(16)); // Random colour for the title
    }
}

colorizeThePages();

//Color friends
async function colorizeFriendsMe() {
    if (options.colorize_friends_me > 0) {
        if ((URLContains("index.php") || (window.location.pathname.startsWith('/forum/') && window.location.pathname.endsWith('/forum/'))) && options.colorize_friends_me > 1) {
            const gensmallElements = document.querySelectorAll(".gensmall");
            if (gensmallElements.length > 3 && gensmallElements[3].lastElementChild.textContent !== "Friends") {
                const friends = document.createElement('a');
                friends.href = './ucp.php?i=zebra&mode=friends';
                friends.style.color = color.color_of_friends;
                friends.textContent = 'Friends';
                const selector = gensmallElements[3];
                selector.append(", ", friends);
            }
        }

        const friendsList = await retrievesFriendsLists(); // Get friends list here
        const links = document.querySelectorAll("a[href^='./memberlist.php'], .postauthor, .gen, .postlink-local, .quotetitle");
        links.forEach(link => {
            let nickname = link.textContent;
            if (link.classList.contains('quotetitle')) nickname = nickname.slice(0, -7);
            if (USERNAME === nickname && (options.colorize_friends_me === 1 || options.colorize_friends_me === 3)) {
                link.style.color = color.color_of_me;
            }
            if (friendsList.includes(nickname) && options.colorize_friends_me > 1) {
                link.style.color = color.color_of_friends;
            }
        });
    }
}

colorizeFriendsMe();

function searchURL() {
    const searchBar = document.querySelector("#searchBar");
    const searchScope = document.getElementById("searchScope").value;
    const searchTerms = document.getElementById("searchTerms").value;
    const searchLocation = document.getElementById("searchLocation").checked ? "firstpost" : options.special_search_parameter.searchTopicLocation === "all" || options.special_search_parameter.searchTopicLocation === "msgonly" ? options.special_search_parameter.searchTopicLocation : "all";
    const showResultsAsPosts = document.getElementById("showAsPosts").checked ? "posts" : "topics";
    const searchAuthor = document.getElementById("searchAuthor").value;
    let forumID = "";
    let topicID = "0";
    const searchSubforums = options.special_search_parameter.searchSubforums;
    const sortResultsBy = options.special_search_parameter.sortResultsBy;
    const sortOrderBy = options.special_search_parameter.sortOrderBy;
    const limitToPrevious = options.special_search_parameter.limitToPrevious;
    const returnFirst = options.special_search_parameter.returnFirst;

    if (searchScope === "thisForum") {
        const urlParams = new URLSearchParams(window.location.search);
        const f = urlParams.get("f");
        if (f) forumID = "&fid%5B%5D=" + f;
    }

    if (searchScope === "thisTopic") {
        const urlParams = new URLSearchParams(window.location.search);
        topicID = urlParams.get("t") || "0"; // Default to "0" if t is not found
    }

    window.location.href = `./search.php?keywords=${encodeURIComponent(searchBar.value).replace(/%20/g, "+")}&terms=${searchTerms}&author=${encodeURIComponent(searchAuthor).replace(/%20/g, "+")}${forumID}&sc=${searchSubforums}&sf=${searchLocation}&sk=${sortResultsBy}&sd=${sortOrderBy}&sr=${showResultsAsPosts}&st=${limitToPrevious}&ch=${returnFirst}&t=${topicID}`;
}

async function specialSearch() {
    if (options.special_search) {
        const cell = $("#menubar > table:nth-child(3) > tbody > tr > td:nth-child(2)")[0];
        if (!cell) return; // Exit if cell not found

        const container = document.createElement("div");
        container.style.cssText = "position: relative; display: inline-block;";

        let searchScopeOptions;
        if (URLContains("viewtopic.php")) {
            searchScopeOptions = `
                <option value="everywhere">Everywhere</option>
                <option value="thisForum">This forum</option>
                <option value="thisTopic">This topic</option>
            `;
        } else if (URLContains("viewforum.php")) {
            searchScopeOptions = `
                <option value="everywhere">Everywhere</option>
                <option value="thisForum">This forum</option>
            `;
        } else {
            searchScopeOptions = `
                <option value="everywhere">Everywhere</option>
            `;
        }

        const specialSearchParametersJSON = options.special_search_parameter;
        const searchLocationChecked = specialSearchParametersJSON.searchTopicLocation === "titleonly" || specialSearchParametersJSON.searchTopicLocation === "firstpost" ? "checked" : "";
        const showAsPostsChecked = specialSearchParametersJSON.showResultsAsPosts ? "checked" : "";
        const searchTermsSelected = specialSearchParametersJSON.searchTermsSpecificity;

        container.innerHTML = `
            <input id="searchBar" type="text" placeholder="Special search">
            <div id="searchOptions" style="display: none; position: absolute; background-color:#1c1c1c; border-top:0.5em solid black; text-align: left;">
                <div style="padding: 0.5em;">
                    <label for="searchScope" style="color: white;">Search:</label>
                    <select id="searchScope" name="searchScope">
                        ${searchScopeOptions}
                    </select>
                </div>
                <div style="padding: 0.5em;">
                    <label for="searchTerms" style="color: white;">Search for:</label>
                    <select id="searchTerms" name="searchTerms">
                        <option value="any" ${searchTermsSelected === 'any' ? 'selected' : ''}>Any term</option>
                        <option value="all" ${searchTermsSelected === 'all' ? 'selected' : ''}>All terms</option>
                    </select>
                </div>
                <div style="padding: 0.5em;">
                    <input type="checkbox" id="searchLocation" name="searchLocation" value="firstPost" ${searchLocationChecked}>
                    <label for="searchLocation" style="color: white;">Search first post/titles only</label>
                </div>
                <div style="padding: 0.5em;">
                    <input type="checkbox" id="showAsPosts" name="showAsPosts" ${showAsPostsChecked}>
                    <label for="showAsPosts" style="color: white;">Show as posts</label>
                </div>
                <div style="display: flex; align-items: center; justify-content: center; padding: 0.5em;">
                    <label for="searchAuthor" style="color: white;">By: </label>
                    <input type="text" id="searchAuthor" name="searchAuthor" placeholder="Author's name">
                </div>
                <div style="display: flex; align-items: center; justify-content: center; padding: 0.5em;">
                    <button id="searchButton">Search</button>
                </div>
            </div>
            `;

        cell.prepend(container);

        const searchBar = document.querySelector("#searchBar");
        const searchOptions = document.querySelector("#searchOptions");
        if (!searchBar || !searchOptions) return; // Exit if elements not found

        searchBar.addEventListener("click", (event) => {
            event.stopPropagation();
            searchOptions.style.display = "block";
        });

        searchOptions.addEventListener("click", event => event.stopPropagation());

        document.addEventListener("click", () => {
            if (searchOptions.style.display === "block") {
                searchOptions.style.display = "none";
            }
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                searchOptions.style.display = "none";
            }
        });

        searchBar.addEventListener("keydown", ev => {
            if (ev.code === "Enter") {
                searchURL();
            }
        });
        $("#searchButton").on("click", searchURL); // Use jQuery for event binding

        if (specialSearchParametersJSON.showFriends) {
            const friendsList = await retrievesFriendsLists(); // Get friends list here
            const searchAuthorInput = document.querySelector("#searchAuthor");
            if (!searchAuthorInput) return; // Exit if input not found

            const friendsClass = document.createElement("div"); // Changed from class to div, class is a reserved word in strict mode
            friendsClass.id = "friends-lists-search";
            friendsClass.style.cssText = "position: absolute; top: 100%; left: 0; background-color:#1c1c1c; border: 0.5em solid black; border-top: none; z-index: 10; max-height: 200px; overflow-y: auto; display: none;";

            const friendTitle = document.createElement('p');
            friendTitle.textContent = "Friends (" + friendsList.length + "):";
            friendTitle.style.cssText = "color: white; padding: 0.5em;";

            const friendsLists = document.createElement("ul");
            friendsLists.style.cssText = "list-style: none; padding: 0; margin: 0;";

            if (!friendsList.length) {
                const friendItem = document.createElement("li");
                friendItem.textContent = "Go make some friends :)";
                friendItem.style.cssText = "color: white; padding: 0.5em; cursor: pointer;";
                friendsLists.appendChild(friendItem);
            } else {
                friendsList.forEach(friend => {
                    const friendItem = document.createElement("li");
                    friendItem.textContent = friend;
                    friendItem.style.cssText = "color: white; padding: 0.5em; cursor: pointer;";
                    friendItem.addEventListener("click", () => {
                        searchAuthorInput.value = friend;
                        friendsClass.style.display = "none";
                    });
                    friendsLists.appendChild(friendItem);
                });
            }

            friendsClass.appendChild(friendTitle);
            friendsClass.appendChild(friendsLists);
            searchOptions.appendChild(friendsClass);

            searchAuthorInput.addEventListener("click", event => {
                event.stopPropagation();
                friendsClass.style.display = "block";
            });

            Array.from(searchOptions.children).slice(0, -1).forEach(option => { // Exclude last child (friendsClass)
                option.addEventListener('click', () => {
                    friendsClass.style.display = "none";
                });
            });

            document.addEventListener("click", () => {
                if (searchOptions.style.display === "block") {
                    friendsClass.style.display = "none";
                }
            });
        }
    }
}

specialSearch();

function showAllSpoilers() {
    if (options.show_all_spoilers) {
        $('input[type="button"][value="Show"]').click(); // Use jQuery for simpler click
    }
}

showAllSpoilers();

function addLinkToQuote(message, id) {
    const link = `${FORUM_BASE_URL}viewtopic.php?p=${id}#p${id}`;
    const firstQuoteIndex = message.indexOf('[quote');
    if (firstQuoteIndex !== -1) {
        const firstQuoteEndIndex = message.indexOf(']', firstQuoteIndex) + 1;
        const beforeQuote = message.substring(0, firstQuoteIndex); // Use substring for clarity
        const quoteTag = message.substring(firstQuoteIndex, firstQuoteEndIndex); // Use substring for clarity
        const afterQuote = message.substring(firstQuoteEndIndex); // Use substring for clarity
        return `${beforeQuote}[url=${link}]${quoteTag}[/url]${afterQuote}`; // Use template literals for readability
    }
    return message;
}

function AddLinkQuote() {
    if (options.add_link_quote) {
        const searchParams = new URLSearchParams(window.location.search);
        const id = searchParams.get('p');
        const topic = searchParams.get('t');
        const mode = searchParams.get('mode');
        const sid = searchParams.get('sid');
        const messageTextArea = document.querySelector('textarea[name="message"]');
        if (messageTextArea && id && !topic && mode !== "edit" && !sid) {
            messageTextArea.value = addLinkToQuote(messageTextArea.value, id);
        }
    }
}

AddLinkQuote();

// Quick reply panel
if (options.quick_reply && quickReplyPanel) {
    let button = document.createElement("button");
    button.textContent = "Show Quick Reply Panel";
    button.style.cssText = "position: fixed; bottom: 0%; left: 0%; min-height: 40px; min-width: 50px; width: 10%; height: 3%; z-index: 9999;";
    button.addEventListener("click", function () {
        if (quickReplyPanel.style.position !== "sticky") {
            quickReplyPanel.style.cssText = "position: sticky; bottom: 0px;"; // More efficient CSS setting
            button.textContent = "Hide Quick Reply Panel";
        } else {
            quickReplyPanel.style.position = "static";
            button.textContent = "Show Quick Reply Panel";
        }
    });
    document.body.appendChild(button);
}

function quotify() {
    if (quickReplyPanel) {
        $("a:has([title='Reply with quote'])").each(function () {
            const quoteLink = this.href;
            if (!quoteLink.includes("posting.php")) return;
            this.href = "javascript:void(0)";
            const $this = $(this); // Cache $(this)

            $this.find('[title="Reply with quote"]').off('click').on("click", function () { // Ensure no duplicate event listeners and use .off('click')
                GM_xmlhttpRequest({
                    url: quoteLink,
                    onload: function (response) {
                        let postBody = $(response.responseText).find("[name=message]").text();
                        if (options.add_link_quote) {
                            postBody = addLinkToQuote(postBody, $(this).closest('.row1, .row2').closest('tr').find("a[name]").attr("name")?.slice(1)); // Get post ID dynamically
                        }
                        $("[name=message]").val(function (_, val) { return val + postBody }); // Use function to append
                        const quoted = $('<span class="quoted">Quoted!</span>').css({ // Inline CSS for brevity
                            'position': 'absolute',
                            'top': $this.offset().top - 20 - 22, // Use calculated height 22px
                            'left': $this.offset().left + ($this.outerWidth() / 2) - 12 - 30 // Use calculated width 30px
                        });
                        $('body').append(quoted);
                        setTimeout(() => quoted.fadeOut(500, () => quoted.remove()), 2000); // FadeOut with callback for removal
                    },
                    onerror: (error) => {
                        console.error("Error quoting post:", error); // Error handling for AJAX
                    }
                });
            });
        });
    }
}

quotify();

function collapseQuotes() {
    if (!options.collapse_quotes) return;

    $('.quotecontent').each(function () {
        const $quoteContent = $(this); // Cache $(this)
        if ($quoteContent.prev().is('.quote-container')) return; // Skip if already collapsed

        const outerDiv = $('<div>').addClass('quote-container'); // Added class for easier selection if needed
        const innerDiv = $('<div>').css('margin-bottom', '2px');
        const button = $('<input>', { type: 'button', value: 'Show' }).css({ margin: '0px', padding: '0px', width: '60px', fontSize: '10px' }); // jQuery object creation
        const contentDiv = $('<div>').css({ border: '1px inset', padding: '6px' });
        const hiddenDiv = $('<div>').css('display', 'none').append($quoteContent.contents()); // Move content and hide

        innerDiv.append(button);
        contentDiv.append(hiddenDiv);
        outerDiv.append(innerDiv, contentDiv);
        $quoteContent.before(outerDiv).hide(); // Hide original quote content

        button.on('click', function () {
            hiddenDiv.toggle(); // Use toggle for show/hide
            $(this).val(hiddenDiv.is(':visible') ? 'Hide' : 'Show'); // Update button text based on visibility
        });
    });
}

collapseQuotes();