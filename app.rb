require "rubygems"
require "bundler/setup"

require 'sinatra/base'
require 'mysql2'
require 'yaml'
require 'yajl/json_gem'
require 'erb'

require 'pp'

module QueryDB

  def self.db
    unless @db
      config = YAML.load_file("config/database.yml")
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

    get "/" do
      @title = "Query DB"
      load_tables
      erb :index
    end

    post "/query" do
      begin
        results = QueryDB.db.query(params[:sql])
        @results = results.to_a
        @query_info = analyze(params[:sql])
        @columns = results.fields
         
        result = {
          :html => erb(:query, :layout => false),
          # :meta => @query_info
        }

        content_type "application/json"
        result.to_json
      rescue Mysql2::Error => e
        halt 400, e.message
      end
    end

    protected
      def load_tables
        results = query(%[SHOW TABLES])
        @tables = []
        results.each do |row|
          @tables << row.first
        end
      end

      # Find the table within the SQL statement
      def analyze(sql)
        meta = {}
        meta[:table] = sql.match(/from\s+([A-Za-z0-9_]+)/i)[1]

        meta
      end
  end
end
