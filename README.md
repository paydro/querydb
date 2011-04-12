# QueryDB

QueryDB is a MySQL database browser for the web. QueryDB fixes the pain points
in browsing data. Here are the few things QueryDB does to alleviate MySQL
querying.

* Keyboard shortcuts, once learned, is the fastest way to work in an
  application. Use GMail or Photoshop lately? QueryDB uses Vi-like key bindings.
* Query history should be very easy to access. QueryDB is built for the web
  which means history built in with a known model.


## Prerequisites

* Ruby 1.9.2
* Bundler


## Installation

Get the code:

    $ git clone git://github.com/paydro/querydb.git

Copy the `database.yml.example`

    $ cd querydb/config $ cp database.yml.example database.yml

Edit your database.yml to point to the correct MySQL server. Here's what mine
looks for my localhost:

    # database.yml
    hostname: localhost
    username: root password:
    database: sweet_database

Now start up the app with rackup (or your favorite rack server):

    # back up a dir
    $ cd ..  $ rackup config.ru

Go to `http://localhost:9292` in your browser and query away!


## Keyboard Shortcuts

There are three different areas within the application that can be focused:
manual query box, database tables, and query results.

    n: Next query (same as forward button)
    p: Previous query (same as back button)

    gt: Focus on the database tables' filter box
    gs: Focus on the manual SQL query

    h: Move to the left cell in the results area
    l: Move to the right cell in the results area
    j: Move down one row
    k: Move up one row
    $: Move to the last cell in the row
    0: Move to the first cell in the row

    r: Reload current query

    v: Expand the current selected row's text columns
    V: Expand all text columns in the results
    CTRL+V: Hide all text columns in the results

    When focused in the query box
    CTRL+Enter: Submit query

    When focused in the table filter input
    Up/Down: Select up/down table
    Enter: Show the first 200 records for the table
    CTRL-Enter: Describe the table



