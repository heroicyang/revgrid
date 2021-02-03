'use strict';

exports.grid = `
.hypergrid-container {
    position: relative;
    height: 500px;
}
.hypergrid-container > div:first-child {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
}
.hypergrid-container > div:first-child > div.info {
    position: absolute;
    display: none; /* initially hidden */
    margin-top: 150px; /* to place below headers */
    color: #eee;
    text-shadow: 1px 1px #ccc;
    font-size: 36pt;
    font-weight: bold;
    text-align: center;
    top: 0; right: 0; bottom: 0; left: 0;
}
.hypergrid-textfield {
    position: absolute;
    font-size: 12px;
    color: black;
    background-color: ivory;
    box-sizing: border-box;
    margin: 0;
    padding: 0 5px;
    border: 0; /*border: 1px solid #777;*/
    outline: 0;
}

.hypergrid {
    touch-action: none;
}
`;
