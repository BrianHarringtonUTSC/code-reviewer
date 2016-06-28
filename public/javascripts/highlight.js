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
		highlight(startLine, endLine, comment);
	}

	window.getSelection().removeAllRanges();
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
		nextElement.addEventListener("mouseover", showPopup.bind(null, i));
		nextElement.addEventListener("mouseout", hidePopup);

		nextElement.setAttribute('comment', (nextElement.getAttribute('comment') ? nextElement.getAttribute('comment') : '') + comment + '<br>');
	};
}

function showPopup(line) {
	var x = event.clientX;
	var y = event.clientY;
	var element = document.getElementById('popup');
	element.style.display = 'block';
	element.style.top = y;
	element.style.left = x;
	document.getElementById('popup').innerHTML = document.getElementById('line-' + String(line)).getAttribute('comment');
}

function hidePopup() {
	document.getElementById('popup').style.display = 'none';
}
