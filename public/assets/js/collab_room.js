$(document).ready(function() {

    // ----------------------------- Variables -----------------------------
    var lobbyendpoint = "/";
    var verifyEndpoint = "/verify";
    var questionsEndpoint = "/questions";

    var editorMapper = ace.edit("editorMapper");
    var editorReducer = ace.edit("editorReducer");
    var server = io.connect(lobbyendpoint);

    var roomCount = 0;
    var question_id = "";
    var room = {};
    var position = ''; //this is the current position
    var username = $.now();

    var roomId = GetURLParameter('room');
    var lang = GetURLParameter('lang');
    var pos = GetURLParameter('pos');
    room.roomId = roomId;
    // ----------------------------- Setup files -----------------------------
    setupEditor();
    checkRoomFull();
    enterRoom();
    realtime();

    function setupEditor() {

        editorMapper.setTheme("ace/theme/eclipse");
        editorMapper.setShowPrintMargin(false);
        editorMapper.setHighlightActiveLine(true);
        editorMapper.resize();
        editorMapper.setBehavioursEnabled(true);
        editorMapper.getSession().setUseWrapMode(true);
        document.getElementById('editorMapper').style.fontSize = '14px';

        editorReducer.setTheme("ace/theme/eclipse");
        editorReducer.setShowPrintMargin(false);
        editorReducer.setHighlightActiveLine(true);
        editorReducer.resize();
        editorReducer.setBehavioursEnabled(true);
        editorReducer.getSession().setUseWrapMode(true);
        document.getElementById('editorReducer').style.fontSize = '14px';

        if (lang === "javascript") {
            editorMapper.getSession().setMode("ace/mode/javascript");
            editorReducer.getSession().setMode("ace/mode/javascript");
        } else if (lang === "python") {
            editorMapper.getSession().setMode("ace/mode/python");
            editorReducer.getSession().setMode("ace/mode/python");
        }

        if (pos === 'reducer') {
            editorMapper.setReadOnly(true);
            editorReducer.setReadOnly(false);
        } else if (pos === 'mapper') {
            editorMapper.setReadOnly(false);
            editorReducer.setReadOnly(true);
        }
    }


    // ----------------------------- Click Listeners -----------------------------



    // ----------------------------- Methods -----------------------------

    //Socket coding realtime

    function realtime() {
        //Change Listen

        // var range = new Range(1, 1, 10, 10);
        // var markerMapper = editorMapper.getSession().addMarker(range, "ace_selected_word", "text");
        // var markerReducer = editorReducer.getSession().addMarker(range, "ace_selected_word", "text");

        var stateMapper = true;
        var stateReducer = true;
        console.log('codeChange' + roomId + position);
        server.on('codeChange' + roomId + position, function(send) {
            console.log(position);
            var code = send.code;
            var callbackPos = send.callbackPos;

            if (position === 'reducer') {
                console.log(callbackPos);
                if (callbackPos == 'mapper') {
                    console.log('ken:3');
                    editorMapper.setValue(code);
                    editorMapper.getSession().getSelection().selectionLead.setPosition(1, 1);
                    // editorMapper.getSession.removeMarker(markerMapper);
                }
            }
            if (position === 'mapper') {

                if (callbackPos == 'reducer') {
                    console.log('ken:4');
                    editorReducer.setValue(code);
                    editorReducer.getSession().getSelection().selectionLead.setPosition(1, 1);
                    // editorReducer.getSession.removeMarker(markerReducer);
                }
            }
        });

        //Code change
        editorMapper.getSession().on('change', function(e) {
            // if (stateMapper == true) {
            //     stateMapper = false;
            // } else {
            //     stateMapper = true;
            // }

            // if (stateMapper == false) {
                console.log('ken:1');
                var code = editorMapper.getValue();
                // console.log(code);
                server.emit('codeChangeMapper', room, code);
            // }
        });

        editorReducer.getSession().on('change', function(e) {

            // if (stateReducer == true) {
            //     stateReducer = false;
            // } else {
            //     stateReducer = true;
            // }

            // if (stateReducer == false) {
                console.log('ken:2');
                var code = editorReducer.getValue();
                // console.log(code);
                server.emit('codeChangeReducer', room, code);
            // }
        });
    }

    function checkRoomFull() {
        server.on('enterRoom' + roomId, function(room) {
            roomCount++;
            // when both players have entered the room
            takeSide();
            if (roomCount == 2) {
                room.roomCount = roomCount;
                room.pos = pos;
                server.emit('closeRoom', room);
                server.emit('takeSide', room);
                position = pos;
                takeSide();
                realtime();
            }

            // console.log(roomCount);
        });
    }

    function takeSide() {
        console.log('setSide' + roomId + position);
        server.on('setSide' + roomId + position, function(room) {
            if (position === 'reducer') {
                editorMapper.setReadOnly(true);
                editorReducer.setReadOnly(false);
            } else if (position === 'mapper') {
                editorMapper.setReadOnly(false);
                editorReducer.setReadOnly(true);
            }
        });
    }

    function enterRoom() {
        console.log('Enter Room');
        room.member = username;
        server.emit('connectRoom', room);
        if (pos === 'reducer') {
            position = 'mapper';
        } else if (pos === 'mapper') {
            position = 'reducer';
        }
    }

    // Not working yet

    function loadQuestions() {
        var questionId = GetURLParameter('id');
        var url = questionsEndpoint; //this is the url to call
        var param = "callback=?" + "&id=" + questionId; //add the related parameters

        $.getJSON(url, param).done(function(data) {
            console.log(JSON.stringify(data));
            question_id = data.question_id;
            var question = data.question;
            var hint = data.hint;
            var title = data.title;
            js_code = data.js_code;
            py_code = data.py_code;
            //add question
            $('#question').empty().append("<h4><b>" + title + "</b></h4>" + question);
            $('#hint').append(hint);
            //setcode type
            editor.setValue(js_code);
            setupEditor();
            var nextq = question_id + 1;
            //update the link for the new challenge
            $('#nextClass').attr("href", top.location.href.substring(0, top.location.href.indexOf('?')) + "?id=" + nextq);
        }).fail(function(jqxhr, textStatus, error) {
            var err = textStatus + ', ' + error;
            console.log("Request Failed: " + err);
        });
        totalQuestions();
    }


    //Not working yet.

    function runMapper() {
        var url = verifyEndpoint; //this is the url to call
        var code = editorMapper.getValue();
        var currentLang = lang;

        code = encodeURIComponent(code);
        var param = "callback=?&lang=" + currentLang + "&q_id=" + question_id + "&solution=" + code; //lang, q_id, solution
        $.getJSON(url, param, function(data) {
            console.log(JSON.stringify(data));
            var error = data.errors;
            if (error == null) {
                var call = data.results[0].call; //array
                var correct = data.results[0].correct; //array
                var solved = data.solved; //boolean
                $('#console').append("Call: " + call + "\nCorrect: " + correct + "\nSolved: " + solved + "\n....\n");
                $('#console').scrollTop($('#console')[0].scrollHeight);
            } else {
                if (error != null) {
                    alert(error);
                }
            }

        });
    }

    //Not working yet.

    function runReducer() {
        var url = verifyEndpoint; //this is the url to call
        var code = editorReducer.getValue();
        var currentLang = lang;

        code = encodeURIComponent(code);
        var param = "callback=?&lang=" + currentLang + "&q_id=" + question_id + "&solution=" + code; //lang, q_id, solution
        $.getJSON(url, param, function(data) {
            console.log(JSON.stringify(data));
            var error = data.errors;
            if (error == null) {
                var call = data.results[0].call; //array
                var correct = data.results[0].correct; //array
                var solved = data.solved; //boolean
                $('#console').append("Call: " + call + "\nCorrect: " + correct + "\nSolved: " + solved + "\n....\n");
                $('#console').scrollTop($('#console')[0].scrollHeight);
            } else {
                if (error != null) {
                    alert(error);
                }
            }

        });
    }

    // ----------------------------- Utility -----------------------------

    function GetURLParameter(sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) {
                return sParameterName[1];
            }
        }
    }

    function updateURLParameter(url, param, paramVal) {
        var newAdditionalURL = "";
        var tempArray = url.split("?");
        var baseURL = tempArray[0];
        var additionalURL = tempArray[1];
        var temp = "";
        if (additionalURL) {
            tempArray = additionalURL.split("&");
            for (i = 0; i < tempArray.length; i++) {
                if (tempArray[i].split('=')[0] != param) {
                    newAdditionalURL += temp + tempArray[i];
                    temp = "&";
                }
            }
        }

        var rows_txt = temp + "" + param + "=" + paramVal;
        return baseURL + "?" + newAdditionalURL + rows_txt;
    }


});
// Prevent accidental backspace press out of the editor text areas
$(document).keydown(function(e) {
    var element = e.target.nodeName.toLowerCase();
    if ((element != 'editorMapper') || (element != 'editorReducer')) {
        if (e.keyCode === 8) {
            return false;
        }
    }
});
