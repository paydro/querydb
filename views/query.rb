module QueryDB::App::Views
  class Query < Layout
    def table
      @query_info[:table]
    end

    def columns
      @columns ||= @results.fetch_fields.collect {|f| f.hash }
    end

    def rows
      lambda do |template|
        data = ""

        @results.each_hash do |row|
          cols = columns.collect do |c|
            { :name => row[c["name"]], :type => type(c) }
          end
          data << render(template, :cols => cols)
        end

        data
      end
    end

    protected

        DB_TYPES = {
          Mysql::Field::TYPE_SHORT => "type_short",
          Mysql::Field::TYPE_YEAR => "type_year",
          Mysql::Field::TYPE_INT24 => "type_int",
          Mysql::Field::TYPE_CHAR => "type_char",
          Mysql::Field::TYPE_DOUBLE => "type_double",
          Mysql::Field::TYPE_SET => "type_set",
          Mysql::Field::TYPE_DECIMAL => "type_decimal",
          Mysql::Field::TYPE_DATETIME => "type_datetime",
          Mysql::Field::TYPE_LONGLONG => "type_longlong",
          Mysql::Field::TYPE_VAR_STRING => "type_var_string",
          Mysql::Field::TYPE_FLOAT => "type_float",
          Mysql::Field::TYPE_NEWDECIMAL => "type newdecimal",
          Mysql::Field::TYPE_ENUM => "type_enum",
          Mysql::Field::TYPE_TIME => "type_time",
          Mysql::Field::TYPE_TIMESTAMP => "type_timestamp",
          Mysql::Field::TYPE_STRING => "type_string",
          Mysql::Field::TYPE_LONG => "type_long",
          Mysql::Field::TYPE_BIT => "type_bit",
          Mysql::Field::TYPE_TINY => "type_tiny",
          Mysql::Field::TYPE_DATE => "type_date",
          Mysql::Field::TYPE_NULL => "type_null",
          Mysql::Field::TYPE_BLOB => "type_blob",
      }

      def type(column)
        DB_TYPES[column['type']]
      end
  end
end
