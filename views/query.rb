module QueryDB::App::Views
  class Query < Layout
    def columns
      @columns ||= @results.fetch_fields.collect {|f| f.name }
    end

    def records
      rows = []
      @results.each_hash do |row|
        r = "<tr>"
        columns.each do |col|
          r << "<td>#{row[col]}</td>\n"
        end
        r << "</tr>"
        rows << {:row => r}
      end

      rows
    end

    def rows
      lambda do |template|
        data = ""

        @results.each_hash do |row|
          attrs = columns.collect {|c| row[c]}
          str = render(template, :cols => attrs)
          data << str
        end

        data
      end
    end

    def cols
      lambda do |template|
        render(template)
      end
    end

  end
end
