$(document).ready(function() {

    // ----------------------------- Variables -----------------------------
    var questionsEndpoint = "/questions";
    var totalQuestionsEndpoint = "/total_questions";
    var verifyEndpoint = "/verify";
    var questionId = GetURLParameter('id');
    var currentLang = "js";
    var js_code = "";
    var py_code = "";
    var editor = ace.edit("editor");
    var spinnerVisible = false;

    // ----------------------------- Setup files -----------------------------
    setupEditor();
    loadQuestions();
    noQuestionCheck();

    function setupEditor() {
        editor.setTheme("ace/theme/eclipse");
        editor.getSession().setMode("ace/mode/javascript");
        editor.setShowPrintMargin(false);
        editor.setHighlightActiveLine(true);
        editor.resize();
        editor.setBehavioursEnabled(true);
        editor.getSession().setUseWrapMode(true);
        document.getElementById('editor').style.fontSize = '14px';
    }


    // ----------------------------- Click Listeners -----------------------------

    $("#run").click(function() {
        run();
        _gaq.push(['_trackEvent', 'run', 'click', 'learn']);
    });
    $("#reset").click(function() {
        var c = "";
        if (currentLang == "py") {
            c = py_code;
        } else {
            c = js_code;
        }
        editor.setValue(c);
        $('#console').text("");
    });

    $('#nextClass').click(function(){
        if (_gaq) _gaq.push(['_trackEvent', 'learn', 'next', questionId, 'run']);
    });

    // Toggle the tabs
    $("#langJS").click(function() {
        $(this).toggleClass("active");
        $("#langPY").toggleClass("active");
        editor.setValue(js_code);
        setupEditor();
        currentLang = "js";
        editor.getSession().setMode("ace/mode/javascript");
    });
    $("#langPY").click(function() {
        $(this).toggleClass("active");
        $("#langJS").toggleClass("active");
        editor.setValue(py_code);
        setupEditor();
        currentLang = "py";
        editor.getSession().setMode("ace/mode/python");
    });

    // ----------------------------- Methods -----------------------------

    // Load the question, the preloaded code, and the appropriate hint
    function loadQuestions() {
        
        var url = questionsEndpoint; //this is the url to call
        var param = "callback=?" + "&id=" + questionId; //add the related parameters
        $.getJSON(url, param).done(function(data) {
            // console.log(JSON.stringify(data));
            questionId = data.question_id;
            var question = data.question;
            var hint = data.hint;
            var title = data.title;
            js_code = data.js_code;
            py_code = data.py_code;
            $('#question').empty().append("<h4><b>" + title + "</b></h4>" + question);
            $('#hint').append(hint);
            editor.setValue(js_code);
            reloadCode();
            setupEditor();
            var nextq = questionId + 1;
            $('#nextClass').attr("href", top.location.href.substring(0, top.location.href.indexOf('?')) + "?id=" + nextq);
        }).fail(function(jqxhr, textStatus, error) {
            var err = textStatus + ', ' + error;
            // console.log("Request Failed: " + err);
        });
        totalQuestions();
    }

    function totalQuestions() {

        var url = totalQuestionsEndpoint; 
        var param = "type=solo&callback=?";

        showProgress();
        $.getJSON(url, param, function(data) {
            // console.log(JSON.stringify(data));
            if (questionId >= data.number) {
                $('#nextClass').attr("disabled", "disabled");
                $('#nextClass').removeAttr("href");
            }
            for (var i = 1; i <= data.number; i++) {
                addEpisodes(i);
            }
            hideProgress();

        });
    }

    function run() {
        var url = verifyEndpoint; //this is the url to call
        var code = editor.getValue();
        code = encodeURIComponent(code);
        var param = "callback=?&lang=" + currentLang + "&q_id=" + questionId + "&solution=" + code; //lang, q_id, solution
        showProgress();
        $.getJSON(url, param, function(data) {
            // console.log(JSON.stringify(data));
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
                    hideProgress();
                }
            }
            hideProgress();
        });
    }

    function addEpisodes(num) {
        $('#episodes:last').append('<a href="learn.html?id=' + num + '"><h4>Episode ' + num + '<i class="icon-forward"></i></h4></a>');
    }

    function reloadCode() {
        var code = editor.getSession().getValue();
        editor.getSession().setValue(code);
    }

    $('body').keyup(function(event) {
        //space bar
        if (event.ctrlKey || event.metaKey) {
            switch (String.fromCharCode(event.which).toLowerCase()) {
            case 'q':
                event.preventDefault();
                reloadCode();
                break;
            }
        }
    });

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

    function noQuestionCheck(){
        questionId = GetURLParameter('id');
        if (typeof(questionId) == 'undefined') {
            window.location.href = "learn.html?id=1";
        }
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
