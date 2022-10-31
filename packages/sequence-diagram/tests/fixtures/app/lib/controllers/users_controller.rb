require_relative '../models/user'
require_relative '../views/users/show'
require_relative '../views/users/list'
require 'json'

class UsersController
  attr_reader :params

  def initialize(params)
    @params = params
  end

  # @label mvc.controller
  def show
    find_user_options = { must: true }.merge(params[:find_user_options] || {})
    user = User.find(self.params[:id], **find_user_options);
    [ Views::Users::Show.new(user).show, 200 ]
  rescue
    [ { error: $!.to_s }, 404 ]
  end

  # @label mvc.controller
  def list
    find_user_options = { must: true }.merge(params[:find_user_options] || {})
    users = User.list(self.params[:id], **find_user_options);
    [ Views::Users::List.new(users).list, 200 ]
  rescue
    [ { error: $!.to_s }, 404 ]
  end
end
