$:.unshift(File.dirname(__FILE__))
require 'sinatra/base'
require 'mustache/sinatra'
require 'mysql'
require 'yaml'
require 'pp'

module QueryDB

  def self.db
    unless @db
      config = YAML.load_file("config/database.yml")
      @db = Mysql.connect(
        config["host"],
        config["user"],
        config["password"],
        config["database"],
        config["port"]
      )
    end
    @db
  end

  class App < Sinatra::Base
    register Mustache::Sinatra
    require 'views/layout'

    set :public, File.dirname(__FILE__) + "/public"
    set :mustache, {
      :views => "views",
      :templates => "templates",
      :namespace => QueryDB::App
    }

    get "/" do
      @title = "Query DB"
      load_tables
      mustache :index
    end

    post "/query" do
      begin
        @results = QueryDB.db.query(params[:sql])
        mustache :query, :layout => false
      rescue Mysql::Error => e
        halt 400, e.message
      end
    end

    protected
      def load_tables
        results = tables = QueryDB.db.query(%[SHOW TABLES])
        @tables = []
        results.each do |row|
          @tables << row.first
        end
      end
  end
end
