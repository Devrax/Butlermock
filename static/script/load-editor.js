// require is provided by loader.min.js.
var theEditor = null;
var previewer = null;
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs' }});

require(["vs/editor/editor.main"], () => {
  theEditor = monaco.editor.create(document.getElementById('container'), {
    value: `interface GithubUser {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
      name: string;
      company?: any;
      blog: string;
      location: string;
      email?: any;
      hireable: boolean;
      bio: string;
      twitter_username?: any;
      public_repos: number;
      public_gists: number;
      followers: number;
      following: number;
      created_at: Date;
      updated_at: Date;
    }`,
    language: 'typescript',
    theme: 'vs-dark',
    minimap: {
      enabled: false
    }
  });

  previewer = monaco.editor.create(document.getElementById('preview-code'), {
    value: ``,
    language: 'json',
    theme: 'vs-dark',
    readOnly: true,
    minimap: {
        enabled: false
    }
})
});
