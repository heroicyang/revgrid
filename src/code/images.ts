// This is a hack to get the library to compile.  It does not work.  Use instructions in Webpack to include images.
export interface Image {
    type: string;
    data: string;
    width: number;
}

export interface Images {
    [name: string]: Image;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const images: Images = {
	'calendar': {
		type: 'image/png',
		data: 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAc0lEQVR4nIXQwQkCMRSE4U9ZLMCT9Xjaq2AfNhfYU5oQLMAOtoN48EWei5iBIRPe/yYQ3qrhf1lFG7iKcEaJxSfukUvMWgdHavt0uWHtg2QwxXnAnJZ2uOLyVZtybzzhgWNmfoFl0/YB87NbzR1cjP9xeQHSDC6mcL1xFQAAAABJRU5ErkJggg==',
        width: 0,
	},
	'checked': {
		type: 'image/png',
		data: 'iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA4xpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQwIDc5LjE2MDMwMiwgMjAxNy8wMy8wMi0xNjo1OTozOCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoxZmM0YjdjYS01N2U3LTRjZTUtYWE3Zi1kYmFjZTU0ODJmZjciIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MkIzRUM3OEQzNkMyMTFFODhEOUJCMzRBRUM0QUQ5QUMiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MkIzRUM3OEMzNkMyMTFFODhEOUJCMzRBRUM0QUQ5QUMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIEVsZW1lbnRzIDE2LjAgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDphZjdjMDA1NS1mMzJlLTQ1NjAtOGQxOS1lYTU1NGVhNDkzMmEiIHN0UmVmOmRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo0YmZiODQwOS03ZWY0LTExN2ItYjI4MS05MDYxODEwMDAwMDAiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5PI8IaAAAAkFBMVEVOTk5NTU29vb1paWnPz8/AwMC7u7u5ublDQ0NSUlJFRUVfX1/IyMixsbHi4uKFhYXT09PDw8NXV1fKysrMzMxYWFhzc3N7e3ve3t6ioqK+vr7Ly8uhoaHa2tqysrKurq7s7Oyvr6/Jycm2trbt7e3X19fh4eG1tbW/v7+3t7fo6OhERES6urrW1tbd3d0AAADC/hfQAAAAMHRSTlP//////////////////////////////////////////////////////////////wBipdB4AAAAcElEQVR42hTIRRbDMAwAUYVTZoa4ZleyfP/btZrVfwOlq4l66utlge5lrbIqq0cL9JX07Onv8PZr791pvm8H+DBrbhBiTn9f4IzjjcW6Qhw3zNnAxLHChln+iq9xsRUPQNFlyYUjlF0KwZiQDuUnwACjfw8FagWYLwAAAABJRU5ErkJggg==',
        width: 0,
	},
	'down-rectangle': {
		type: 'image/png',
		data: 'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAABpJREFUGFdjgIL/eDAKIKgABggqgAE0BQwMAPTlD/Fpi0JfAAAAAElFTkSuQmCC',
        width: 0,
	},
	'filter-off': {
		type: 'image/png',
		data: 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAMCAYAAABSgIzaAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAChSURBVChTzZHBCoUgFET9TqEiskgyWoutQvRLRIr+cR7XQAjiJW/1BgZmMUevXsY5xy9OoDEGMcYiUzeB67qibVuwQjVNA6311V+WBeM4vsLDMEApde/1fY9pmtI453neHEKAlBJd1z0fXtc16PbjODK07zvmeUZVVd8nooc75zJIOX3Gm6i0bVsGKf8xKIRIuyJTLgJJ3nvQzsjW2geIsQ/pr9hMVrSncAAAAABJRU5ErkJggg==',
        width: 0,
	},
	'filter-on': {
		type: 'image/png',
		data: 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAMCAYAAABSgIzaAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAACoSURBVChTY3BqfP2fHAzWmDbj7f8p294RhVOBasEa02e+/e/VBmQQCTxaX/9PnvYGoj5ywpv/Qd2ENft3vv4f1gfVBAP+nW/+h/a+ATtn1q73KHjytvdgg3070DTBgHvL6/8g22fsQGiaDmSHA21xaybgIpDHixa8hWssnA8NDEIApCh3LkIjiD2INYJCL2X6W3B8gdhEaQQBUOCA4gyE8+e9xaKJgQEA/74BNE3cElkAAAAASUVORK5CYII=',
        width: 0,
	},
	'unchecked': {
		type: 'image/png',
		data: 'iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAMAAACecocUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA4xpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQwIDc5LjE2MDMwMiwgMjAxNy8wMy8wMi0xNjo1OTozOCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDphNDQ3MTQ0Zi0wYmFmLTQ3YzMtYjBmNi1kODRlNDI0MjU4ZDIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MkIzRUM3OTEzNkMyMTFFODhEOUJCMzRBRUM0QUQ5QUMiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MkIzRUM3OTAzNkMyMTFFODhEOUJCMzRBRUM0QUQ5QUMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIEVsZW1lbnRzIDE2LjAgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo1OWY2YWVhMC0xZjJkLTRjM2UtYTRiZi02MWYyMDNlMmI4YjciIHN0UmVmOmRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo2Nzk3NWVjNC03ZWY0LTExN2ItYjI4MS05MDYxODEwMDAwMDAiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6ywX99AAAAYFBMVEW5ubm/v7/X19fLy8vp6ene3t69vb2xsbG6urq+vr6urq7a2tq4uLji4uLIyMjBwcHDw8PJycnPz8/V1dW1tbWvr6/t7e23t7e7u7vs7Oy2trbo6Ojh4eHW1tbd3d0AAAAm0pqPAAAAIHRSTlP/////////////////////////////////////////AFxcG+0AAABZSURBVHjaTIqHDoAgEEOLC9wL5RTP+/+/VIIxdCTNSyFjZQwR1YNAtftxhOQLUHjvQ68K+orqW2C7P7FL9okmrjLl5cv1/+lAKuOVmTObQyZ32tdulkeAAQCpggrEM7zMmAAAAABJRU5ErkJggg==',
        width: 0,
	},
	'up-down-spin': {
		type: 'image/png',
		data: 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAPCAYAAADUFP50AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAGJJREFUOE+lkwEKACEIBH2Zb/PnHsoGeaVJDUjGOgRRpKpkiIj+y4MME3eDR7kaKOVNsJyMNjIHzGy9YnW6J7qIcrriQimeCqORNABd0fpRTkt8uVUj7EsxC6vs/q3e/Q6iD2bwnByjPXHNAAAAAElFTkSuQmCC',
        width: 0,
	},
	'up-down': {
		type: 'image/png',
		data: 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAPCAYAAADUFP50AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAGFJREFUOE+lkkEKQCEIRD2ZJ3Ph3iN4WD9GflpYhj0YYowpGgJmbikd3gjMDFokwbuT1iAiurG5nomgqo5QaPo9ERQRI6Jf7sfGjudy2je23+i0Wl2oQ85TOdlfrJQOazF8br+rqTXQKn0AAAAASUVORK5CYII=',
        width: 0,
	},
}
