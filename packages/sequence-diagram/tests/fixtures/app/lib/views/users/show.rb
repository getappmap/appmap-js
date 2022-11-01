require_relative '../posts/show'

module Views
  module Users
    class Show
      attr_reader :user

      def initialize(user)
        @user = user
      end

      def show
        user.to_h.tap do |data|
          data[:posts] = user.posts.map { |post| Posts::Show.new(post).show }
        end
      end
    end
  end
end
