Command = "node ./built/cli.js upload -v -d ../../land-of-apps/sample_app_6th_ed --report-file ../../land-of-apps/sample_app_6th_ed/appland-findings.json --app scanner-demo/sample_app_6th_ed"
Times = (ARGV[0] || 3).to_i

threads = ([Command] * Times).map do |cmd|
  Thread.new {
    system cmd
  }
end

threads.map(&:join)
