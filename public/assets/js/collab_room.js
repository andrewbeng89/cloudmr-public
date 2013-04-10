$(document).ready(function() {

    // ----------------------------- Variables -----------------------------
    var lobbyendpoint = "/";
    var verifyEndpoint = "/verify";
    var questionsEndpoint = "/questions";
    var totalQuestionsEndpoint = "/total_questions";

    var editorMapper = ace.edit("editorMapper");
    var editorReducer = ace.edit("editorReducer");
    var server = io.connect(lobbyendpoint);

    var spinnerVisible = false;
    var roomCount = 0;
    var question_id = "";
    var room = {};
    var position = ''; //this is the current position
    var username = $.now();
    var questionId = GetURLParameter("id");

    var roomId = GetURLParameter('room');
    var lang = GetURLParameter('lang');
    if (lang == 'javascript') {
        lang = 'js';
    } else if (lang == 'python') {
        lang = 'py';
    }
    var pos = GetURLParameter('pos');
    room.roomId = roomId;
    // ----------------------------- Setup files -----------------------------
    setupEditor();
    checkRoomFull();
    enterRoom();
    realtime();
    loadQuestions();
    whichRun();
    disableAll();

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

        if (lang === "js") {
            editorMapper.getSession().setMode("ace/mode/javascript");
            editorReducer.getSession().setMode("ace/mode/javascript");
        } else if (lang === "py") {
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

    $("#runMapper").click(function() {
        run();
        _gaq.push(['_trackEvent', 'run', 'click', 'collab mapper']);
    });

    $("#runReducer").click(function() {
        run();
        _gaq.push(['_trackEvent', 'run', 'click', 'collab reducer']);
    });

    $("#mapReduce").click(function() {
        runMapReduce();
        _gaq.push(['_trackEvent', 'run', 'click', 'collab combine']);
    });

    // Clear possible whitespace
    $('#consoleMapper').text('');
    $('#consoleReducer').text('');
    $('#nextQuestion').hide('');

    // ----------------------------- Methods -----------------------------

    //Socket coding realtime

    function realtime() {
        //Change Listen

        var stateMapper = true;
        var stateReducer = true;
        console.log('codeChange' + roomId + position);

        //listen change code
        server.on('codeChange' + roomId + position, function(send) {
            console.log(position);
            var code = send.code;
            var callbackPos = send.callbackPos;

            if (position === 'reducer') {
                console.log(callbackPos);
                if (callbackPos == 'mapper') {
                    editorMapper.setValue(code);
                    editorMapper.getSession().getSelection().selectionLead.setPosition(1, 1);
                    // editorMapper.getSession.removeMarker(markerMapper);
                }
            }
            if (position === 'mapper') {

                if (callbackPos == 'reducer') {
                    editorReducer.setValue(code);
                    editorReducer.getSession().getSelection().selectionLead.setPosition(1, 1);
                    // editorReducer.getSession.removeMarker(markerReducer);
                }
            }
        });

        //broadcast code change
        editorMapper.getSession().on('change', function(e) {

            var code = editorMapper.getValue();
            server.emit('codeChangeMapper', room, code);

        });

        editorReducer.getSession().on('change', function(e) {

            var code = editorReducer.getValue();
            server.emit('codeChangeReducer', room, code);

        });

        //listen console change
        server.on('consoleChange' + roomId + position, function(send) {

            var consoleText = send.consoleText;
            var callbackPos = send.callbackPos;

            if (position === 'reducer') {
                if (callbackPos == 'mapper') {
                    $('#consoleMapper').val(consoleText);
                }
            }
            if (position === 'mapper') {
                if (callbackPos == 'reducer') {
                    $('#consoleReducer').val(consoleText);
                }
            }

        });

        //challenge complete listener
        server.on('challengeComplete' + roomId, function(room) {
            var nextq = questionId+1;
            var fullLang = "";
            if (lang == 'js') {
                fullLang = 'javascript';
            } else if (lang == 'py') {
                fullLang = 'python';
            }
            console.log(top.location.href.substring(0, top.location.href.indexOf('?')) + "?room="+roomId+"&lang="+fullLang+"&pos="+pos+"&id=" + nextq);
            var url = totalQuestionsEndpoint;
            var param = "type=collab&callback=?";
            $.getJSON(url, param, function(data) {
                
                if(data.number >= nextq){

                    $('#nextQuestion').attr("href", top.location.href.substring(0, top.location.href.indexOf('?')) + "?room="+roomId+"&lang="+fullLang+"&pos="+pos+"&id=" + nextq);
                    
                }else{
                    $('#nextQuestion').removeAttr("href").attr("disabled","disabled").text("No more challenges!");
                   
                }
                $('#nextQuestion').show('');
             });   
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
                whichRun();
                alert("A player has entered");
            }
        });
    }

    function takeSide() {
        console.log('setSide' + roomId + position);
        server.on('setSide' + roomId + position, function(room) {
            if (position === 'reducer') {
                editorMapper.setReadOnly(true);
                editorReducer.setReadOnly(false);
                enableReducer();
            } else if (position === 'mapper') {
                editorMapper.setReadOnly(false);
                editorReducer.setReadOnly(true);
                enableMapper();
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

    function loadQuestions() {

        var url = questionsEndpoint; //this is the url to call
        var param = "callback=?" + "&id=" + questionId; //add the related parameters
        showProgress();
        $.getJSON(url, param).done(function(data) {
            console.log(JSON.stringify(data));
            questionId = data.question_id;
            var q = questionId.toString().split(".");
            var modQ = q[0];
            var question = data.question;
            var hint = data.hint;
            var title = data.title;
            js_code = data.js_code;
            py_code = data.py_code;

            $('#questionHeader').empty().append("<h4><b>Challenge " + modQ + ": " + title + "</b></h4>");
            $('#question').empty().append(question);

            hideProgress();
        }).fail(function(jqxhr, textStatus, error) {
            var err = textStatus + ', ' + error;
            console.log("Request Failed: " + err);
        });
        // totalQuestions();
    }

    function totalQuestions() {

        var url = totalQuestionsEndpoint; //this is the url to call
        var param = "type=solo&callback=?";

        showProgress();
        $.getJSON(url, param, function(data) {
            console.log(JSON.stringify(data));
            if (questionId >= data.number) {
                $('#nextClass').attr("disabled", "disabled");
            }

            for (var i = 1; i <= data.number; i++) {
                addEpisodes(i);
            }
            hideProgress();

        });
    }

    function whichRun() {
        if (position == "mapper") {
            $('#runReducer').attr('disabled', 'disabled');
            $('#resetReducer').attr('disabled', 'disabled');
            $('#runMapper').removeAttr('disabled');
            $('#resetMapper').removeAttr('disabled');
        } else {
            $('#runMapper').attr('disabled', 'disabled');
            $('#resetMapper').attr('disabled', 'disabled');
            $('#runReducer').removeAttr('disabled');
            $('#resetReducer').removeAttr('disabled');

        }

    }

    function run() {
        var url = verifyEndpoint; //this is the url to call
        var role = "";
        var code = "";
        if (position == "mapper") {
            code = editorMapper.getValue();
            role = "mapper";
        } else {
            code = editorReducer.getValue();
            role = "reducer";
        }
        code = encodeURIComponent(code);
        var param = "callback=?&lang=" + lang + "&q_id=" + questionId + "&solution=" + code+"&role="+role; //lang, q_id, solution
        showProgress();
        console.log(param);
        $.getJSON(url, param, function(data) {
            console.log(JSON.stringify(data));
            var error = data.errors;
            if (error == null) {
                var call = data.results[0].call; //array
                var correct = data.results[0].correct; //array
                var solved = data.solved; //boolean
                if (position == 'mapper') {
                    $('#consoleMapper').append("Call: " + call + "\nCorrect: " + correct + "\nSolved: " + solved + "\n....\n");
                    $('#consoleMapper').scrollTop($('#consoleMapper')[0].scrollHeight);
                } else if (position = 'reducer') {
                    $('#consoleReducer').append("Call: " + call + "\nCorrect: " + correct + "\nSolved: " + solved + "\n....\n");
                    $('#consoleReducer').scrollTop($('#consoleReducer')[0].scrollHeight);
                }
                consoleChange();
                hideProgress();
            } else {
                if (error != null) {
                    alert(error);
                    hideProgress();
                }
            }

        });
    }


    function runMapReduce() {

        var url = verifyEndpoint; //this is the url to call
        var code = "";
        var mapperCode = editorMapper.getValue();
        var reducerCode = editorReducer.getValue();
        var role = "combined";
        code = mapperCode + "\n\n" + reducerCode;
        console.log(code);
        code = encodeURIComponent(code);
        var param = "callback=?&lang=" + lang + "&q_id=" + questionId + "&solution=" + code+"&role="+role; //lang, q_id, solution
        showProgress();
        console.log(param);
        $.getJSON(url, param, function(data) {
            console.log(JSON.stringify(data));
            var error = data.errors;
            if (error == null) {
                var call = data.results[0].call; //array
                var correct = data.results[0].correct; //array
                var solved = data.solved; //boolean
                if (position == 'mapper') {
                    $('#consoleMapper').append("MapReduce Initiated!\nCombining....\nCall: " + call + "\nCorrect: " + correct + "\nSolved: " + solved + "\n....\n");
                    $('#consoleMapper').scrollTop($('#consoleMapper')[0].scrollHeight);
                } else if (position = 'reducer') {
                    $('#consoleReducer').append("MapReduce Initiated!\nCombining....\nCall: " + call + "\nCorrect: " + correct + "\nSolved: " + solved + "\n....\n");
                    $('#consoleReducer').scrollTop($('#consoleReducer')[0].scrollHeight);
                }
                consoleChange();
                checkComplete(correct, solved);

                hideProgress();
            } else {
                if (error != null) {
                    alert(error);
                }
            }

        });
    }


    function checkComplete(correct, solved) {
        // correct = true;
        // solved = true;
        room.pos = pos;
        if (correct == true && solved == true) {
            server.emit('challengeComplete', room);
        }
    }

    function consoleChange() {
        if (position == 'mapper') {
            var consoletext = $('#consoleMapper').val();
            server.emit('consoleChangeMapper', room, consoletext);
        } else if (position = 'reducer') {
            var consoletext = $('#consoleReducer').val();
            server.emit('consoleChangeReducer', room, consoletext);
        }
    }

    function showProgress() {
        if (!spinnerVisible) {
            $("div#spinner").fadeIn("fast");
            spinnerVisible = true;
        }
    }

    function hideProgress() {
        if (spinnerVisible) {
            var spinner = $("div#spinner");
            spinner.stop();
            spinner.fadeOut("fast");
            spinnerVisible = false;
        }
    }

    function enableReducer(){
        $('#runReducer').removeAttr("disabled");
        $('#resetReducer').removeAttr("disabled");
        $('#mapReduce').removeAttr("disabled");
    }
    function enableMapper(){
        $('#runMapper').removeAttr("disabled");
        $('#resetMapper').removeAttr("disabled");
        $('#mapReduce').removeAttr("disabled");
    }

    function disableAll(){
        $('#runMapper').attr("disabled","disabled");
        $('#runReducer').attr("disabled","disabled");
        $('#resetMapper').attr("disabled","disabled");
        $('#resetReducer').attr("disabled","disabled");
        $('#mapReduce').attr("disabled","disabled");
        editorMapper.setReadOnly(true);
        editorReducer.setReadOnly(true);
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


