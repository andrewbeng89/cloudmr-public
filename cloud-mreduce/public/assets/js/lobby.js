$(document).ready(function() {

    // ----------------------------- Variables -----------------------------


    // ----------------------------- Setup files -----------------------------



    // ----------------------------- Click Listeners -----------------------------

    $("#create").click(function() {
        alert('hey');
    });

    // ----------------------------- Methods -----------------------------

   

    // ----------------------------- Utility -----------------------------

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
