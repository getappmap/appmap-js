require_relative './lib/make_appmap';
require_relative '../lib/controllers/users_controller';

controller = UsersController.new(id: '1')
p controller.show
