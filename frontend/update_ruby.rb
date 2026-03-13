require 'logger'

class Foo
    def initialize(debug=false)
       @debug = debug
       @logger = Logger.new($stdout)
       @logger.level = @debug ? Logger::DEBUG : Logger::INFO
       
       if @debug
         @logger.debug 'Init debug'
       else
         @logger.info 'Init info'
       end
    end

    def do_work
        @logger.info 'Starting work'
        (1..5).each do |i|
           @logger.debug "Working on #{i}"
           sleep 1
        end
        @logger.info 'Finished work'
    end
end
