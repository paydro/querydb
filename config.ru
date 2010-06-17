$:.unshift(File.dirname(__FILE__))
require 'app'

use Rack::ShowExceptions

run QueryDB::App.new

