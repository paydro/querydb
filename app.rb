require "rubygems"
require "bundler/setup"

require 'sinatra/base'
require 'mysql2'
require 'yaml'
require 'yajl/json_gem'
require 'erb'
require 'ruby-debug'
require 'pp'

module QueryDB

  def self.db
    unless @db
      config = YAML.load_file("config/database.yml")
      Mysql2::Client.default_query_options.merge!(:as => :array)
      @db = Mysql2::Client.new(
        :host => config["host"],
        :username => config["username"],
        :password => config["password"],
        :database => config["database"],
        :port => config["port"]
      )
    end
    @db
  end


  class App < Sinatra::Base
    def query(sql, options = {})
      QueryDB.db.query(sql, options)
    end

    set :public, File.dirname(__FILE__) + "/public"

    helpers do
      include Rack::Utils
      alias_method :h, :escape_html

      # Determine what type of column the field is. Not very awesome, 
      # but solves the issues of text fields being to large and stopping
      # time fields from wrapping.
      #
      # Better solution: parse the SQL statement to find the table(s) and
      # determine column types
      def column_class(col, val)
        classes = []
        classes << "text" if(val.is_a?(String) && val.length > 100)
        classes << "string" if(val.is_a?(String) && val.length <= 100)
        classes << "datetime" if col.match(/^.*(_at|_on)$/)
        if classes.empty?
          ""
        else
          %Q[ class="#{classes.join(" ")}"]
        end
      end
    end

    get "/" do
      @title = "Query DB"
      load_tables
      erb :index
    end

    post "/query" do
      begin
        @results = query(params[:sql])
        @columns = @results.fields

        result = {
          :html => erb(:query, :layout => false),
        }

        content_type "application/json"
        result.to_json
      rescue Mysql2::Error => e
        halt 400, e.message
      end
    end

    protected
      def load_tables
        @tables = query(%[SHOW TABLES])
      end
  end
end
