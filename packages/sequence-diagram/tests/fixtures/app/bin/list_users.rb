require_relative './lib/make_appmap';
require_relative '../lib/controllers/users_controller';

controller = UsersController.new(id: %w[1 2 3 4 5], find_user_options: { prefetch_posts: false })
p controller.list
