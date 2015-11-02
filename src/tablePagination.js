﻿(function ($, undefined) {
    /*
     * Private Static variables
     */
    var data = [],
        TablePaginater = function () { },
        getGuid = function () {
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

        init: function (options, elem) {
            this._table = elem;
            this.$_table = $(elem);
            this._options = options;

            this.paginateTable();
            this.addResultsPerPage();
            this.addPageNavBar();
        },

        /*
         * Alters the visibility of the table to show only the rows that fit 
         * on a page.
         */
        paginateTable: function () {
            var rows = this.$_table.find('tbody tr');
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

            var container = $('#' + this._index + '_ResultsPerPageContainer');

            if (!container || container.length == 0) {
                html += '<div id="' + this._index + '_ResultsPerPageContainer" class="col-xs-12 col-sm-6 col-md-5 col-lg-4 pull-right ';

                if (this._options.results_per_page.pad_top) {
                    html += ' pad-top-md ';
                }

                if (this._options.results_per_page.pad_bottom) {
                    html += ' pad-btm-md ';
                }

                html += 'pad-right-no">';
                html += '<div class="col-xs-6"><label class="pull-right">Number of results per page:</label></div>';
                html += '<div class="col-xs-6 pad-right-no">';
                html += '<select id="' + this._index + '_ResultsPerPage" class="chosen-select">';

                $.each(this._options.list_show_results, function (index, elem) {
                    if (self._options.visible_rows == elem) {
                        html += '<option selected>' + elem + '</option>';
                    } else {
                        html += '<option>' + elem + '</option>';
                    }
                });

                html += '</select>';
                html += '</div>';
                html += '</div>';

                if (this._options.results_per_page.above) {
                    this.$_table.parent().prepend(html);
                } else {
                    this.$_table.parent().append(html);
                }
            } else {
                select = $('#' + this._index + '_ResultsPerPage');
                select.empty();

                $.each(this._options.list_show_results, function (index, elem) {
                    if (self._options.visible_rows == elem) {
                        select.append('<option selected>' + elem + '</option>');
                    } else if (self._showAllResults && elem == 'Show All') {
                        select.append('<option selected>' + elem + '</option>');
                    } else {
                        select.append('<option>' + elem + '</option>');
                    }
                });
            }

            $(".chosen-select").chosen({ disable_search_threshold: 10 });
            $('.chosen').trigger('chosen:updated');
        },

        /*
         * Adds the nav bar html to the table
         */
        addPageNavBar: function () {
            var totalRows = (this._filteredRows || $(this._table).find('tbody tr')).length;

            var pages = Math.ceil(totalRows / this._options.visible_rows);
            var html = '';
            var nav = $('#' + this._index + '_nav');

            if (!nav || nav.length == 0) {
                html += '<div id="' + this._index + '_nav" class="col-xs-12">';
                html += '<div class="text-center">';
                html += '<ul class="pagination pagination-sm tpage-nav" tpage-table-index="' + this._index + '">';

                if (pages > this._options.disable_pages_jump_threshhold) {
                    html += '<li jump-first tpage-index="1"><a href="javascript:void(0)">«</a></li>';
                }

                html += '<li class="active" tpage-index="1"><a href="javascript:void(0)">1</a></li>';

                for (var i = 2; i <= pages; ++i) {
                    html += '<li tpage-index="' + i + '"><a href="javascript:void(0)">' + i + '</a></li>';
                }


                if (pages > this._options.disable_pages_jump_threshhold) {
                    html += '<li jump-last tpage-index="' + pages + '"><a href="javascript:void(0)">»</a></li>';
                }

                html += '</ul>';
                html += '</div></div>';

                this.$_table.parent().append(html);
            } else {
                var ul = nav.find('ul');
                ul.empty();
                ul.removeClass('hidden');

                if (pages > this._options.disable_pages_jump_threshhold) {
                    ul.append('<li jump-first tpage-index="1"><a href="javascript:void(0)">«</a></li>');
                }

                ul.append('<li class="active" tpage-index="1"><a href="javascript:void(0)">1</a></li>');

                for (var i = 2; i <= pages; ++i) {
                    ul.append('<li tpage-index="' + i + '"><a href="javascript:void(0)">' + i + '</a></li>');
                }

                if (pages > this._options.disable_pages_jump_threshhold) {
                    ul.append('<li jump-last tpage-index="' + pages + '"><a href="javascript:void(0)">»</a></li>');
                }
            }

            if (pages <= 1) {
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
                rows = $(this._table).find('tbody tr');
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
            var rows = this.$_table.find('tbody tr');
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

    /* 
     * Public jQuery plugin method.
     * usage: $('selector').tpage(options);
     */
    $.fn.tpage = function (options) {
        if (!this.length) {
            return;
        }

        var settings = $.extend({
            visible_rows: 15,
            include_show_all: true,
            list_show_results: [15, 25, 50, 100],
            disable_pages_jump_threshhold: 5,
            results_per_page: {
                above: true,
                right: true,
                pad_top: true,
                pad_bottom: true
            },
            filter: {
                elem: null,
                refresh_delay: 0, // not yet implemented
                ignore_columns_attr: null,
                ignore_columns: []
            },
            ajax: { // not yet implemented
                url: null,
                totalRows: -1
            }
        }, options);

        settings.list_show_results.sort(function (a, b) {
            return a - b;
        });

        if ($.inArray(settings.visible_rows, settings.list_show_results) == -1) {
            settings.list_show_results.push(settings.visible_rows);
        }

        if (settings.include_show_all) {
            settings.list_show_results.push('Show All');
        }

        var tp;
        var key = $(this).attr('tpage-table-id');

        if (data[key]) {
            tp = data[key];
            tp.init(settings, this);
            return tp._index;
        }

        tp = new TablePaginater();
        tp._index = getGuid();
        tp.init(settings, this);
        data[tp._index + '_table'] = tp;

        var self = this;

        $('#' + tp._index + '_nav').on('click', 'li', function () {
            if ($(this).hasClass('active')) {
                return;
            }

            var nav = $(this).parent('ul');
            var li = $(nav).find('li');
            var index = $(this).attr('tpage-index');
            var pages = li.length - 2;
            var table = $('[tpage-table-id="' + tp._index + '_table"]');

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
})(jQuery);