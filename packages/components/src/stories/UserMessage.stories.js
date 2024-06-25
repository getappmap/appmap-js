import { default as VUserMessage } from '@/components/chat/UserMessage.vue';
import './scss/vscode.scss';

export default {
  title: 'Pages/Chat',
  component: VUserMessage,
  argTypes: {},
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const UserMessage = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VUserMessage },
  template: `<v-user-message v-bind="$props"></v-user-message>`,
});

UserMessage.args = {
  id: 'system-message-id',
  message: `
Here's an update to the \`index\` action that includes pagination:

<!-- file: app/controllers/users_controller.rb -->
\`\`\`ruby
class UsersController < ApplicationController
  before_action :correct_user,   only: [:edit, :update]
  before_action :admin_user,     only: :destroy
  
  def index
    @users = User.where(activated: true).paginate(page: params[:page])
  end
  
  def show
    @user = User.find(params[:id])
    redirect_to root_url and return unless @user.activated?
  end
end
\`\`\`
  `,
  complete: true,
};
