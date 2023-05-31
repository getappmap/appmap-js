require 'fileutils'
require 'rubygems'
require 'rubygems/commands/install_command'

# Create an isolated GEM_HOME
appmap_gem_home = File.expand_path('~/.appmap/gems')
FileUtils.mkdir_p(appmap_gem_home) unless File.exist?(appmap_gem_home)

# Set GEM_HOME and GEM_PATH environment variables
ENV['GEM_HOME'] = appmap_gem_home
ENV['GEM_PATH'] = "#{appmap_gem_home}:#{Gem.path.join(':')}"
ENV['RUBYOPT'] = ENV['RUBYOPT'].gsub(/-r.*bootstrap.rb/, '')

# Install the gem
installer = Gem::Commands::InstallCommand.new
installer.options[:args] = ['appmap']
installer.options[:install_dir] = appmap_gem_home
installer.options[:bin_dir] = appmap_gem_home
installer.options[:generate_rdoc] = false
installer.options[:generate_ri] = false
installer.options[:version] = Gem::Requirement.default
installer.options[:document] = []

begin
  installer.execute
rescue Gem::SystemExitException => e
  puts "Error installing gem: #{e.exit_code}"
end

Gem.path.push(appmap_gem_home)
Gem.refresh

require 'appmap'
