$(document).ready(function() {
    // Run files
    var editor = ace.edit("editor");
    setupEditor();
    //-----------

    function setupEditor() {

        editor.setTheme("ace/theme/eclipse");
        editor.getSession().setMode("ace/mode/javascript");
        editor.setShowPrintMargin(false);
        editor.setHighlightActiveLine(true);
        editor.resize();
        editor.getSession().setUseWrapMode(true);
    }

    $("#run").click(function() {
        console.log('run');
    });
    $("#reset").click(function() {
        editor.setValue("");
        console.log('reset');
    });


    function exportCode() {

    }
});
