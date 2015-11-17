(function ($, undefined) {
    /*
     * Private Static variables
     */

    /* Allows multiple tables per page to co-exist without affecting each other */
    var data = [];
    var TablePaginater = function () { };
    var guid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    TablePaginater.prototype = {
        _options: {},
        _table: null,
        $_table: null,
        _filteredRows: null,
        _showAllResults: false,
        _index: null,

        init: function (options, elem) {
            this._table = elem;
            this.$_table = $(elem);
            this._options = options;

            this.$_table.attr('tpage-table-id', this._index);
            this.update();
        },

        update: function () {
            this.paginateTable();
            this.addResultsPerPage();
            this.addPageNavBar();
        },

        /*
         * Alters the visibility of the table to show only the rows that fit 
         * on a page.
         */
        paginateTable: function () {
            this.$_table.find('.tpage-hide').each(function () {
                $(this).addClass('hidden');
            });

            var rows = this.$_table.find('tbody tr').not('.tpage-hide');
            var totalRows = rows.length;

            if (this._options.visible_rows == -1) {
                this._options.visible_rows = totalRows;
                this._showAllResults = true;
            } else {
                this._showAllResults = false;
            }

            var pages = Math.ceil(totalRows / this._options.visible_rows);

            for (var i = 0; i < this._options.visible_rows; ++i) {
                $(rows[i]).removeClass('hidden');
            }

            for (var i = this._options.visible_rows; i < rows.length; ++i) {
                $(rows[i]).addClass('hidden');
            }
        },

        /*
         * Adds the results per page container html to the table.
         */
        addResultsPerPage: function () {
            var self = this;
            var html = '';
            var select;
            var attached = this._options.results_per_page.attach_to_element;
            var labelClass = this._options.results_per_page.label_class || 'col-xs-4';
            var selectClass = this._options.results_per_page.select_class || 'col-xs-8';

            var container = $('#' + this._index + '_ResultsPerPageContainer');

            if (!container || container.length == 0) {
                html += '<div id="' + this._index + '_ResultsPerPageContainer">';

                html += '<div class="' + labelClass + '"><label>Results per page:</label></div>';
                html += '<div class="' + selectClass + '" style="padding-right: 0">';
                html += '<select id="' + this._index + '_ResultsPerPage" class="chosen">';

                $.each(this._options.results_per_page.list_show_results, function (index, elem) {
                    if (self._options.visible_rows == elem) {
                        html += '<option selected>' + elem + '</option>';
                    } else {
                        html += '<option>' + elem + '</option>';
                    }
                });

                html += '</select>';
                html += '</div>';
                html += '</div>';

                if (attached) {
                    $(attached).append(html);
                } else {
                    this.$_table.parent().append(html);
                }
            } else {
                select = $('#' + this._index + '_ResultsPerPage');
                select.empty();

                $.each(this._options.results_per_page.list_show_results, function (index, elem) {
                    if (self._options.visible_rows == elem) {
                        select.append('<option selected>' + elem + '</option>');
                    } else if (self._showAllResults && elem == 'Show All') {
                        select.append('<option selected>' + elem + '</option>');
                    } else {
                        select.append('<option>' + elem + '</option>');
                    }
                });
            }

            $('#' + this._index + '_ResultsPerPage').chosen({
                disable_search_threshold: 10,
                width: '100%'
            });
            $('#' + this._index + '_ResultsPerPage').trigger('chosen:updated');
        },

        /*
         * Adds the nav bar html to the table
         */
        addPageNavBar: function () {
            var totalRows = (this._filteredRows || $(this._table).find('tbody tr').not('.tpage-hide')).length;

            var pages = Math.ceil(totalRows / this._options.visible_rows);
            var html = '';
            var nav = $('#' + this._index + '_nav');

            if (!nav || nav.length == 0) {
                html += '<div id="' + this._index + '_nav" class="col-xs-12">';
                html += '<div class="text-center">';
                html += '<ul class="pagination pagination-sm tpage-nav" tpage-table-index="' + this._index + '">';

                if (pages > this._options.jump_nav.disable_pages_jump_threshhold) {
                    html += '<li jump-first tpage-index="1"><a href="javascript:void(0)">«</a></li>';
                }

                html += '<li class="active" tpage-index="1"><a href="javascript:void(0)">1</a></li>';

                for (var i = 2; i <= pages; ++i) {
                    html += '<li tpage-index="' + i + '"><a href="javascript:void(0)">' + i + '</a></li>';
                }

                if (pages > this._options.jump_nav.disable_pages_jump_threshhold) {
                    html += '<li jump-last tpage-index="' + pages + '"><a href="javascript:void(0)">»</a></li>';
                }

                html += '</ul>';
                html += '</div></div>';

                this.$_table.after(html);
            } else {
                var ul = nav.find('ul');
                ul.empty();
                ul.removeClass('hidden');

                if (pages > this._options.jump_nav.disable_pages_jump_threshhold) {
                    ul.append('<li jump-first tpage-index="1"><a href="javascript:void(0)">«</a></li>');
                }

                ul.append('<li class="active" tpage-index="1"><a href="javascript:void(0)">1</a></li>');

                for (var i = 2; i <= pages; ++i) {
                    ul.append('<li tpage-index="' + i + '"><a href="javascript:void(0)">' + i + '</a></li>');
                }

                if (pages > this._options.jump_nav.disable_pages_jump_threshhold) {
                    ul.append('<li jump-last tpage-index="' + pages + '"><a href="javascript:void(0)">»</a></li>');
                }
            }

            if (pages <= 1 && !this._options.jump_nav.show_if_single_page) {
                $('#' + this._index + '_nav').find('ul').addClass('hidden');
            }
        },

        /* 
         * When the user selects a number in the nav bar, jumps to that page, 
         * hiding results before and after the selected page.
         */
        viewPageInTable: function (page) {
            var offset = (page - 1) * this._options.visible_rows;
            var rows;
            var numRows;

            if (this._filteredRows && this._filteredRows.length > 0) {
                rows = this._filteredRows;
            } else {
                rows = $(this._table).find('tbody tr').not('.tpage-hide');
            }

            numRows = rows.length;

            // Hide rows before offset
            for (var i = 0; i < offset; ++i) {
                $(rows[i]).addClass('hidden');
            }

            // Show rows within offset
            for (var i = offset; i < offset + this._options.visible_rows; ++i) {
                $(rows[i]).removeClass('hidden');
            }

            // Hide rows after
            for (var i = offset + this._options.visible_rows; i < numRows; ++i) {
                $(rows[i]).addClass('hidden');
            }
        },

        /*
         * If a filter element has been defined, when its text is changed, the
         * data set will be filtered and the visible rows will only list those
         * that match the filter.
         */
        filter: function (text) {
            var rows = this.$_table.find('tbody tr').not('.tpage-hide');
            var totalRows = 0;
            var self = this;
            var isFilterNull = false;
            this._filteredRows = [];

            this._filterText = text.toLowerCase();

            if (!this._filterText || this._filterText == '') {
                $(rows).each(function (index, elem) {
                    $(elem).removeClass('hidden');
                    self._filteredRows.push(elem);
                })
                isFilterNull = true;
            } else {
                var self = this;

                $(rows).each(function (index, elem) {
                    var rowText = '';

                    $(elem).find('td').each(function (_index, _elem) {
                        if ($(_elem).attr(self._options.filter.ignore_columns_attr) == undefined
                            && $.inArray(_index, self._options.filter.ignore_columns) == -1) {
                            rowText += $(_elem).text().trim().toLowerCase();
                        }
                    });

                    if (rowText.indexOf(self._filterText) == -1) {
                        $(this).addClass('hidden');
                    } else {
                        $(this).removeClass('hidden');
                        self._filteredRows.push(this);
                    }
                });
            }

            if (this._options.visible_rows == -1) {
                this._options.visible_rows = self._filteredRows.length;
                this._showAllResults = true;
            } else {
                this._showAllResults = false;
            }

            var pages = Math.ceil(self._filteredRows.length / this._options.visible_rows);

            for (var i = 0; i < this._options.visible_rows; ++i) {
                $(self._filteredRows[i]).removeClass('hidden');
            }

            for (var i = this._options.visible_rows; i < self._filteredRows.length; ++i) {
                $(self._filteredRows[i]).addClass('hidden');
            }

            if (isFilterNull) {
                this._filteredRows = null;
            }

            this.addPageNavBar();
        }
    }

    $.fn.update = function () {
        if (!this.length) {
            return;
        }

        var key = $(this).attr('tpage-table-id');

        if (data[key]) {
            tp = data[key];
            tp.update();
            return tp._index;
        }

        return '';
    }

    /* 
     * Public jQuery plugin method.
     * usage: $('selector').tpage(options);
     */
    $.fn.tpage = function (options) {
        if (!this.length) {
            return;
        }

        var settings = setOrDefaultSettings(options);

        settings.results_per_page.list_show_results.sort(function (a, b) {
            return a - b;
        });

        if ($.inArray(settings.visible_rows, settings.results_per_page.list_show_results) == -1) {
            settings.results_per_page.list_show_results.push(settings.visible_rows);
        }

        if (settings.results_per_page.include_show_all) {
            settings.results_per_page.list_show_results.push('Show All');
        }

        var tp;
        var key = $(this).attr('tpage-table-id');

        if (data[key]) {
            tp = data[key];
            tp.init(settings, this);
            return tp._index;
        }

        tp = new TablePaginater();
        tp._index = guid();
        tp.init(settings, this);
        data[tp._index] = tp;

        var self = this;

        $('#' + tp._index + '_nav').on('click', 'li', function () {
            if ($(this).hasClass('active')) {
                return;
            }

            var nav = $(this).parent('ul');
            var li = $(nav).find('li');
            var index = $(this).attr('tpage-index');
            var pages = li.length - 2;
            var table = $('[tpage-table-id="' + tp._index + '"]');

            li.each(function (index, elem) {
                $(this).removeClass('disabled');
                $(this).removeClass('active');
            });

            if ($(this).attr('jump-first') != undefined) {
                li.first().addClass('disabled');
                $(li[1]).addClass('active');
            } else if ($(this).attr('jump-last') != undefined) {
                $(li[pages]).addClass('active');
                li.last().addClass('disabled');
            } else {
                $(this).addClass('active');
                li.first().removeClass('disabled');
            }

            tp.viewPageInTable(index);
        });

        $('#' + tp._index + '_ResultsPerPage').on('change', function () {
            settings.visible_rows = parseFloat($(this).find('option:selected').text());

            if (('' + settings.visible_rows) == 'NaN') {
                settings.visible_rows = -1;
            }

            tp.init(settings, self);
        });

        if (settings.filter && settings.filter.elem) {
            $(settings.filter.elem).off('keyup keydown keypress');
            $(settings.filter.elem).on('keyup', function () {
                tp.filter($(this).val() || $(this).text());
            });
        }
    }

    /* 
     * Fill out default settings and override them with the user-specified
     * settings if supplied.
     */
    function setOrDefaultSettings(options) {
        var settings = $.extend({
            visible_rows: 25,
            jump_nav: {
                show_if_single_page: false,
                disable_pages_jump_threshhold: 5,
            },
            results_per_page: {
                include_show_all: true,
                list_show_results: [15, 25, 50, 100],
                label_class: null,
                select_class: null,
                attach_to_element: null
            },
            filter: {
                elem: null,
                refresh_delay: 0, // not yet implemented
                ignore_columns_attr: null,
                ignore_columns: []
            },
            sort: {
                // not yet implemented
            },
            ajax: { // not yet implemented
                url: null,
                totalRows: -1
            }
        }, options);

        settings.jump_nav = {
            disable_pages_jump_threshhold: settings.jump_nav.disable_pages_jump_threshhold || 5
        }

        settings.results_per_page = {
            attach_to_element: settings.results_per_page.attach_to_element == undefined ? null : settings.results_per_page.attach_to_element,
            include_show_all: settings.results_per_page.include_show_all == undefined ? true : settings.results_per_page.include_show_all,
            text_position: settings.results_per_page.text_position == undefined ? 'top' : settings.results_per_page.text_position,
            list_show_results: settings.results_per_page.list_show_results == undefined ? [15, 25, 50, 100] : settings.results_per_page.list_show_results,
        }

        return settings;
    }
})(jQuery);
