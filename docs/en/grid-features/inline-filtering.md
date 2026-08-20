# Inline Filtering

Some grids support _inline filtering_, the ability to filter the data on the client-side without having to re-query the server. The advantages of client-side filtering are:

1. Typically faster for small operations. No need to re-download and format the data for presentation.
2. Data is filtered dynamically. Instead of hitting a submit button to enact the changes, changes are reflected as a user types.

However, there are a few disadvantages to bear in mind:

1. Since no new data is downloaded, filters will only apply to dataset already downloaded. If the download was pre-filtered on the server, you may not have a complete dataset to begin with - always be sure that your local dataset has enough information to provide analysis.
2. On low-power machines, this operation can slow the machine to its knees, particularly in heavier modules like the Journal or Account Statement.

By default, inline filtering is off on all grids. To enable it, click on the **filter button**\(&lt;i class="fa fa-filter"&gt;&lt;/i&gt;\) in the top of the module. When enabled, this button will turn a light blue color. The inline filter inputs will appear just underneath the column headers of the grid. Typing in any one of them will filter the grid contents.

<div class="bs-callout bs-callout-warning">
<h4>Make sure you have a full dataset</h4>
Remember to always check that you have the full dataset before filtering, otherwise you may get misleading results.
</div>
