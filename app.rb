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
      # but solves the issues of text fields being to large
      # time fields wrapping.
      #
      # Better solution: parse the SQL statement to find the table(s) and
      # determine column types
      def column_class(col, val = false)
        html_classes = []
        html_classes << @column_types[col] if @column_types[col]
        html_classes << "null" if val.nil?

        %Q[ class="#{html_classes.join(" ")}"] if !html_classes.empty?
      end

      def value_class(val)
        %Q[ class="null"] if val.nil?
      end

      def value(val, column)
        out = val.nil? ? "NULL" : val
        if @column_types[column] == "text"
          if out.length <= 60
            out = %Q[<div class="text">#{out}</div>]
          else
            out = %Q[
              <div class="text">
                <div class="partial">#{out[0..60]} <br>...</div>
                <div class="full">#{out}</div>
              </div>
            ]
          end
        end

        out
      end
    end

    get "/" do
      @title = "Query DB"
      load_tables
      erb :index
    end

    post "/query" do
      content_type "application/json"

      begin
        if results = query(params[:sql])
          @results = results
          @columns = @results.fields
          @column_types = column_types

          {:html => erb(:query, :layout => false)}.to_json
        else
          affected_rows = query("SELECT ROW_COUNT()").to_a.first.first
          {:affected_rows => affected_rows}.to_json
        end
      rescue Mysql2::Error => e
        halt 400, e.message
      end
    end

    protected
      def load_tables
        @tables = query(%[SHOW TABLES]).collect(&:first)
      end

      # Find the table being queried and find all the column types
      # Only works for single table queries
      def column_types
        types = {}
        if matches = params[:sql].match(/from\s*`?([^\s`]+)`?/im)
          table = matches[1]

          results = query("DESCRIBE `#{table}`")
          results.each do |row|
            types[row[0]] = base_type(row[1])
          end
        end
        types
      end

      def base_type(type)
        return "int" if type.match(/^tinyint|smallint|mediumint|int|bigint/i)
        return "float" if type.match(/^float|decimal/i)
        return "string" if type.match(/^char|varchar/i)
        return type
      end
  end
end
