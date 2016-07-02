var highlight_str = '';
var highlight_array = [];
function set_up_highlight(init_highlights) {
	highlight_array = [];
	var temp_highlight_array = [];
	var temp = [];
	temp_highlight_array = init_highlights.toString().split(",");
	for (var i = 1; i <= temp_highlight_array.length; i++) {
		temp.push(temp_highlight_array[i-1]);
		if (i % 3 == 0) {
			highlight_array.push(temp);
			temp = [];
		}
	}

	for (var i = 0; i < highlight_array.length; i ++) {
		highlight(parseInt(highlight_array[i][0]), parseInt(highlight_array[i][1]), highlight_array[i][2]);
	}
	
	document.getElementById('storage').value = highlight_array;
}


function addCommentFromSelection() {
	var selection = window.getSelection();
	if (!selection || selection.isCollapsed) {
		window.alert('Invalid selection!')
		return;
	}

	var anchorNode = selection.anchorNode;
	var focusNode = selection.focusNode;

	while (anchorNode.nodeName != 'LI') {
		if (anchorNode.parentNode != null) {
			anchorNode = anchorNode.parentNode;
		} else {
			window.alert('Invalid selection!')
			return;
		}
	}

	while (focusNode.nodeName != 'LI') {
		if (focusNode.parentNode != null) {
			focusNode = focusNode.parentNode;
		} else {
			window.alert('Invalid selection!')
			return;
		}
	}

	var startLine = parseInt(anchorNode.id.slice(5));
	var endLine = parseInt(focusNode.id.slice(5));

	if (startLine > endLine) {
		endLine = [startLine, startLine = endLine][0];
	}

	var comment = window.prompt('Please enter your comment:');

	if (comment) {
		store_comments(startLine, endLine, comment);		
		highlight(startLine, endLine, comment);

	}

	window.getSelection().removeAllRanges();
}

function store_comments(startLine, endLine, comment) {
	highlight_array.push([startLine, endLine, comment]);
	document.getElementById('storage').value = highlight_array;
}

function highlight(startLine, endLine, comment) {
	for (var i = startLine; i <= endLine; i++) {
		nextElement = document.getElementById('line-' + String(i));
		if (nextElement.className === "highlight-1") {
			nextElement.className = "highlight-2";
		} else if (nextElement.className === "highlight-2") {
			nextElement.className = "highlight-3";
		} else if (nextElement.className === "highlight-3") {
			;
		} else {
			nextElement.className = "highlight-1";
		}
		nextElement.onmouseover = showPopup;
		//nextElement.addEventListener("mouseover", function(){showPopup(line);});
		nextElement.onmouseout = hidePopup;

		nextElement.setAttribute('comment', (nextElement.getAttribute('comment') ? nextElement.getAttribute('comment') : '') + comment + '<br>');
	};
}

function showPopup(e) {
	var x = e.clientX;
	var y = e.clientY;
	console.log(x, y);
	var element = document.getElementById('popup');
	element.style.display = 'block';
	element.style.top = String(y) + 'px';
	element.style.left = String(x) + 'px';
	var target = e.target;
	while (target && target.nodeName !== 'LI') {
		target = target.parentNode;
	}
	document.getElementById('popup').innerHTML = target.getAttribute('comment');
}

function hidePopup(e) {
	document.getElementById('popup').style.display = 'none';
}

function get_star(num) {
	document.getElementById('star_number').value = num;
}
