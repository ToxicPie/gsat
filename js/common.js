/* Search Engine Robot */
if (/googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest\/0\.|pinterestbot|slackbot|vkShare|W3C_Validator/i.test(navigator.userAgent)) {
	document.getElementById("loading").style.display = "none";
	throw new Error('Use static page for Search Engines');
}


/* Default Varibles */
var default_max_result = 20;
var max_result = default_max_result; // max count for result


/* GSAT Filters */
var gsatYear = "108";
var markLables = [ "未選考", "底標", "後標", "均標", "前標", "頂標", "未設定" ];
var markClasses = [ "negative", "info", "info", "primary", "positive", "positive", "" ];
var filterGsat = {
	"國文": 6,
	"英文": 6,
	"數學": 6,
	"社會": 6,
	"自然": 6,
}
var subjectsAdv = Object.keys(filterAdv);
var subjectsGsat = Object.keys(filterGsat);

const CJK = new RegExp('[a-zA-Z\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]'); // from pangu, CJK + Alphabet


/* Get Table Data */
var xhr = new XMLHttpRequest();
xhr.open('GET', 'data/' + gsatYear + '/' + gsatType, false);
xhr.send(null);
var lines = xhr.response.split('\n');

var data = [];
var lc = {};
for (var i=0; i<lines.length; i++) {
	if (lines[i].length == 0)
		continue;
	var line = lines[i].split('\t');
	datum = {
		id: line[0],
		gsat: line[1].split(""),
		school: line[3],
		name: line[4]
	};

	var adv = line[2].split(" ");
	for (var k = 0; k < subjectsAdv.length; k++)
		datum[ subjectsAdv[k] ] = adv[k];

	if (lc[datum.name] === undefined)
		lc[datum.name] = 1;
	else
		lc[datum.name]++;

	data.push(datum);
}

/* Count Frequency */
var suggestionList = Object.keys(lc).sort(function(a, b) {
	return lc[a] < lc[b];
});



if (localStorage.getItem("gsatMarks"))
	filterGsat = JSON.parse(localStorage.getItem("gsatMarks"));


/* Backward Compatibility before 13 Oct 2019 */
if (localStorage.getItem("favoritesApply")) {
	old = JSON.parse(localStorage.getItem("favoritesApply"));
	localStorage.removeItem("favoritesApply");

	old.sort();
	var favs = old.filter((val, idx, arr) => {
		return val !== 0;
	});
	localStorage.setItem("favs108apply", JSON.stringify(favs));
}

if (localStorage.getItem("favoritesStar")) {
	old = JSON.parse(localStorage.getItem("favoritesStar"));
	localStorage.removeItem("favoritesStar");

	old.sort();
	var favs = old.filter((val, idx, arr) => {
		return val !== 0;
	});
	localStorage.setItem("favs108star", JSON.stringify(favs));
}

if (localStorage.getItem("favoritesAdv")) {
	old = JSON.parse(localStorage.getItem("favoritesAdv"));
	localStorage.removeItem("favoritesAdv");

	old.sort();
	var favs = old.filter((val, idx, arr) => {
		return val !== 0;
	});
	localStorage.setItem("favs108advanced", JSON.stringify(favs));
}
/* End: Backward Compatibility */


var favStorageName = "favs" + gsatYear + gsatType; // e.g. favs108apply

initGsatFilter();

var favs = [];
if (localStorage.getItem(favStorageName))
	favs = JSON.parse(localStorage.getItem(favStorageName));

/* Loaded */
var input = document.getElementById("dep");
parseHash();
adjustGsatFilter();
document.getElementById("loading").style.display = "none";


/* Table Header */
window.addEventListener("scroll", function () {
	var nav = document.getElementsByTagName("nav")[0];
	var body = document.getElementsByTagName("body")[0];
	if (window.scrollY > 200) {
		nav.classList.add("fixed");
		body.style.top = "40px";
	}
	if (window.scrollY < 20) {
		nav.classList.remove("fixed");
		body.style.top = "0px";
	}

	adjustTableHeader();
});

window.addEventListener("resize", () => {
	adjustTableHeader();
})



/* Suggest List */
var currentFocus;
input.addEventListener("keydown", function(e) {
	var x = document.getElementById("dep-list");
	if (x)
		x = x.getElementsByTagName("div");
	if (e.keyCode == 40) { // Down
		currentFocus++;
		addActive(x);
	} else if (e.keyCode == 38) { // Up
		currentFocus--;
		addActive(x);
	} else if (e.keyCode == 13 || e.keyCode == 32) { // Enter || Space
		e.preventDefault();
		if (x && currentFocus > -1)
			x[currentFocus].click();
	}
});

function adjustSuggestion() {
	var a, b, i;
	var search = input.value.toUpperCase();
	currentFocus = -1;

	a = document.getElementById('dep-list');
	a.innerHTML = '';

	var count = 0;
	for (var fuzz = 0; fuzz <= 1; fuzz++) { // fuzz search = {false, true}
		for (i = 0; i < suggestionList.length; i++) {
			if (count >= 5)
				break;

			var item = suggestionList[i].toUpperCase();
			pos = item.indexOf(search);
			if (pos !== -1) { // exactly match
				if (fuzz)
					continue;
			} else if (fuzz) { // try fuzz mode
				var fs = search[0];
				for (var k=1; k<search.length; k++) {
					if (CJK.test(search[k-1]) && CJK.test(search[k]))
						fs += ".*";
					fs += search[k];
				}
				if (!item.match(fs))
					continue; // fuzz search still fail
			} else
				continue; // not matched

			b = document.createElement("div");
			b.id = "sug" + count;
			if (fuzz == 0) {
				b.innerHTML = suggestionList[i].substr(0, pos);
				b.innerHTML += "<strong>" + suggestionList[i].substr(pos, search.length) + "</strong>";
				b.innerHTML += suggestionList[i].substr(pos + search.length);
			} else {
				b.innerHTML = suggestionList[i];
			}
			b.innerHTML += "<input type='hidden' value='" + suggestionList[i] + "'>";

			b.addEventListener("click", function(e) {
				input.value = this.getElementsByTagName("input")[0].value;
				adjustSuggestion();
			});

			a.appendChild(b);
			count++;
		}
	}
	updateTable();
}

function addActive(x) {
	if (!x)
		return false;

	removeActive(x);
	if (currentFocus >= x.length)
		currentFocus = 0;
	if (currentFocus < 0)
		currentFocus = (x.length - 1);

	x[currentFocus].classList.add("autocomplete-active");
	updateTable(x[currentFocus].innerText);
}

function removeActive(x) {
	for (var i = 0; i < x.length; i++)
		x[i].classList.remove("autocomplete-active");
}

/* Initial Page */
function parseHash() {
	if (window.location.hash.length === 0) {
		adjustSuggestion();
		return;
	}
	var queries = decodeURIComponent(window.location.hash).substr(1).split(';');
	for (var i = 0; i < queries.length; i++) {
		var query = queries[i].split('=', 2);
		if (query[0] === 'q') {
			input.value = query[1];
		} else if (query[0] === 'y') {
			filterAdv[query[1]] = 1;
		} else if (query[0] === 'n') {
			filterAdv[query[1]] = -1;
		}
	}
	adjustSuggestion();
}

function initGsatFilter() {
	var fG = document.getElementById("filterGsat").children;
	for (var k = 0; k < 5; k++) {
		var s = subjectsGsat[k];

		var fGm = fG[k].getElementsByClassName("menu")[0];
		for (var i = 0; i <= 6; i++) {
			fGm.children[i].onclick = (e) => {
				var t = e.target;
				var d = t.dataset;
				var m = parseInt(d.mark);
				filterGsat[ d.subject ] = m;
				adjustGsatFilter();
			}
		}
	}
}

function adjustGsatFilter() {
	var fG = document.getElementById("filterGsat").children;

	for (var k = 0; k < 5; k++) {
		var s = subjectsGsat[k];
		var fGb = fG[k];
		var fGt = fGb.getElementsByClassName("text")[0];
		fGb.classList.remove("negative", "info", "primary", "positive")
		if (filterGsat[s] == 6) {
			fGt.innerText = s;
		} else {
			fGb.classList.add(markClasses[ filterGsat[s] ]);
			fGt.innerText = s + ": " + markLables[ filterGsat[s] ];
		}
	}
	localStorage.setItem("gsatMarks", JSON.stringify(filterGsat));
	updateTable();
}

function updateTable(search) {
	if (search === undefined)
		search = input.value;

	var clear = document.getElementById("clear");
	if (search.length == 0) {
		clear.classList.add("hidden1");
		setTimeout(function () {
			clear.classList.add("hidden2");
		}, 500);
	}
	else {
		clear.classList.remove("hidden2");
		setTimeout(function () {
		   clear.classList.remove("hidden1");
		}, 1);
	}

	if (/資訊|APCS|電機/i.test(search))
		document.getElementById('stone').style.display = '';
	else
		document.getElementById('stone').style.display = 'none';

	var href = "#q=" + search;
	if (search == "")
		href = "";

	for (var i = 0; i < 5; i++) {
		var s = subjectsAdv[i];
		if (filterAdv[s] === 1)
			href += ";y=" + s;
		else if (filterAdv[s] === -1)
			href += ";n=" + s;
	}

	if (href == "#q=")
		history.pushState("", document.title, window.location.pathname);
	else
		window.location.hash = href;

	ga('send', 'pageview', {
		'page': location.pathname + location.search + location.hash
	});

	var table = document.getElementById("list");
	table.innerHTML = "";

	for (var k = 0; k < 2; k++) { // fixed header and ordinary header
		var tr = document.createElement('tr');
		for (var i = 0; i < subjectsAdv.length + 4; i++)
			tr.appendChild(document.createElement('th'));

		tr.cells[0].classList.add("favorites");
		tr.cells[1].appendChild(document.createTextNode('學校'));
		tr.cells[1].classList.add("school");
		tr.cells[2].appendChild(document.createTextNode('科系'));
		tr.cells[2].classList.add("dep");

		for (var i = 0; i < subjectsAdv.length; i++) {
			var s = subjectsAdv[i];
			var button = document.createElement('button');
			button.onclick = function(e) {
				var s = e.target.innerText;
				filterAdv[s]++;
				if (filterAdv[s] > 1) filterAdv[s] = -1;
				updateTable();
			}

			button.id = s;
			if (filterAdv[s] === 1) {
				button.classList.add("show");
			} else if (filterAdv[s] === -1) {
				button.classList.add("hidden");
			}

			button.appendChild(document.createTextNode(s));
			tr.cells[i + 3].appendChild(button);
			tr.cells[i + 3].classList.add("sub");
		}

		tr.cells[subjectsAdv.length + 3].appendChild(document.createTextNode('編號'));
		tr.cells[subjectsAdv.length + 3].classList.add("id");

		table.appendChild(tr);
	}

	showFilterDepartments(table, search);

	adjustTableHeader();
}

function showFilterDepartments(table, search) {
	var count = 0;

	for (var showFav = 1; showFav >= 0; showFav--) { // show favorites = {true, false}
		for (var fuzz = 0; fuzz <= 1; fuzz++) { // fuzz search = {false, true}
			for (var idx = 0; idx < data.length; idx++) {
				if (!getDepartmentFilterStatus(idx, search, showFav, fuzz))
					continue;

				var tr = document.createElement('tr');
				id = data[idx].id;
				tr.dataset.id = id;

				for (_ = 0; _ < subjectsAdv.length + 4; _++)
					tr.appendChild(document.createElement('td'));

				tr.cells[0].classList.add("favorites");
				var button = document.createElement('button');
				button.onclick = function(e) {
					t = e.target;
					id = t.parentNode.parentNode.dataset.id;
					index = favs.indexOf(id);
					t.classList.remove("not-fav", "favorited");
					if (index == -1) {
						favs.push(id);
						favs.sort();
						t.classList.add("favorited");
					} else {
						favs.splice(index, 1);
						t.classList.add("not-fav");
					}
					localStorage.setItem(favStorageName, JSON.stringify(favs)); // save
				}
				button.classList.add(showFav ? "favorited" : "not-fav"); // determined by getDepartmentFilterStatus
				tr.cells[0].appendChild(button);

				tr.cells[1].appendChild(document.createTextNode(data[idx].school));
				tr.cells[2].appendChild(document.createTextNode(data[idx].name));

				var link = document.createElement('a');
				link.text = id;
				link.href = getDetailLink(id);
				link.target = '_blank';
				link.classList.add('id');
				tr.cells[subjectsAdv.length + 3].appendChild(link);
				tr.cells[subjectsAdv.length + 3].classList.add("id");

				for (var k = 0; k < subjectsAdv.length; k++) {
					var s = subjectsAdv[k];

					if (data[idx][s] == "--")
						continue;

					if (data[idx][s] == "x0.00")
						continue;

					if (data[idx][s][1] == '標') {
						if (data[idx][s] == '頂標')
							tr.cells[k + 3].classList.add("best");
						if (data[idx][s] == '前標')
							tr.cells[k + 3].classList.add("good");
						if (data[idx][s] == '均標')
							tr.cells[k + 3].classList.add("average");
						if (data[idx][s] == '後標')
							tr.cells[k + 3].classList.add("bad");
						if (data[idx][s] == '底標')
							tr.cells[k + 3].classList.add("worst");
					}

					if (/x\d\.\d\d/.test(data[idx][s])) {
						tr.cells[k + 3].classList.add("mark" + k);
						tr.cells[k + 3].classList.add(data[idx][s].replace('.', '-'));
					} else if (/x\d+/.test(data[idx][s]))
						tr.cells[k + 3].classList.add("multiple");
					else
						tr.cells[k + 3].classList.add("mark");

					if (data[idx][s] == '採計')
						tr.cells[k + 3].classList.add("weighted");


					tr.cells[k + 3].appendChild(document.createTextNode(data[idx][s]));
				}

				count++;
				if (count <= max_result)
					table.appendChild(tr);
			}
		}
	}

	if (count == 0) {
		document.getElementById('no-data').style.display = '';
		document.getElementById('count').style.display = 'none';
		document.getElementById('stone').style.display = 'none';
	} else {
		document.getElementById('no-data').style.display = 'none';
		document.getElementById('count').style.display = '';
	}

	while (max_result > default_max_result && count < max_result / 2) {
		max_result /= 2;
	}

	if (count > max_result) {
		document.getElementById('show-more').style.display = '';
		document.getElementById('count-num').innerHTML = max_result + ' / ' + count;
	} else {
		document.getElementById('show-more').style.display = 'none';
		document.getElementById('count-num').innerHTML = count;
	}
}

function adjustTableHeader() {
	var table = document.getElementById("list");
	var fH = table.childNodes[0];
	fH.classList.add("fixed-header")
	var oH = table.childNodes[1];
	oH.classList.add("ordinary-header")
	for (i = 0; i < fH.childElementCount; i++)
		fH.childNodes[i].style.width = oH.childNodes[i].getBoundingClientRect().width + "px";

	var y = table.getBoundingClientRect().y;
	if (y < 40)
		fH.style.display = "initial";
	else
		fH.style.display = "none";
}

function getDepartmentFilterStatus(idx, search, isFav, fuzz) {
	search = search.toUpperCase();
	if (data[idx].name.toUpperCase().indexOf(search) !== -1) { // exactly match
		if (fuzz)
			return false;
	} else if (fuzz) { // try fuzz mode
		ori = search;
		search = ori[0];
		for (var i=1; i<ori.length; i++) {
			if (CJK.test(ori[i-1]) && CJK.test(ori[i]))
				search += ".*";
			search += ori[i];
		}
		if (!data[idx].name.toUpperCase().match(search))
			return false; // fuzz search still fail
	} else
		return false; // not matched

	id = data[idx].id;
	if (favs.includes(id) != isFav)
		return false;

	for (var k = 0; k < subjectsGsat.length; k++) {
		var s = subjectsGsat[k];

		switch (data[idx].gsat[k]) {
			case "頂":
				if (filterGsat[s] == 4) return false;
			case "前":
				if (filterGsat[s] == 3) return false;
			case "均":
				if (filterGsat[s] == 2) return false;
			case "後":
				if (filterGsat[s] == 1) return false;
			case "底":
				if (filterGsat[s] == 0) return false;
		}
	}

	for (var k = 0; k < subjectsAdv.length; k++) {
		var s = subjectsAdv[k];
		if (data[idx][s] == '--' || data[idx][s] == 'x0.00') {
			if (filterAdv[s] === 1)
				return false;
		} else {
			if (filterAdv[s] == -1)
				return false;
		}
	}

	return true;
}

/* Sync Config */
function saveConfig() {
	var data = new FormData();
	data.append("type", gsatYear + gsatType);
	data.append("favs", localStorage.getItem(favStorageName));

	var xhr = new XMLHttpRequest();
	xhr.open("POST", "sync/save", false);
	xhr.send(data);
	var resp = JSON.parse(xhr.response);
	console.log(resp);
}

function restoreConfig(key) {
	var data = new FormData();
	data.append("key", key);

	var xhr = new XMLHttpRequest();
	xhr.open("POST", "sync/restore", false);
	xhr.send(data);
	var resp = JSON.parse(xhr.response);
	favs = resp.favs;
	localStorage.setItem(favStorageName, JSON.stringify(favStorageName));
	updateTable();
}
