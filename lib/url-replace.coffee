module.exports =
class UrlReplace
  constructor: ->
    @repoInfo = @parseUrl(@getRepositoryForActiveItem()?.getOriginURL())
    @info =
      'repo-name': @repoInfo.name
      'repo-owner': @repoInfo.owner
      'atom-version': atom.getVersion()

  replace: (url) ->
    re = /({[^}]*})/

    m = re.exec url
    while m
      matchedText = m[0]
      url = url.replace m[0], @getInfo(matchedText)

      m = re.exec url

    return url

  getInfo: (key) ->
    key = key.replace /{([^}]*)}/, "$1"
    if @info[key]?
      return @info[key]
    else
      return key

  getRepositoryDetail: ->
    atom.project.getRepositories()

  getActiveItemPath: ->
    @getActiveItem()?.getPath?()

  getRepositoryForActiveItem: ->
    [rootDir] = atom.project.relativizePath(@getActiveItemPath())
    rootDirIndex = atom.project.getPaths().indexOf(rootDir)
    if rootDirIndex >= 0
      @getRepositoryDetail()[rootDirIndex]
    else
      for repo in @getRepositoryDetail() when repo
        return repo

  getActiveItem: ->
    atom.workspace.getActivePaneItem()

  parseUrl: (url) ->
    repoInfo =
      owner: ''
      name: ''

    return repoInfo unless url?

    if url.indexOf 'http' >= 0
      re = /github\.com\/([^\/]*)\/([^\/]*)\.git/
    if url.indexOf('git@') >= 0
      re = /:([^\/]*)\/([^\/]*)\.git/
    m = re.exec url

    if m
      return {owner: m[1], name: m[2]}
    else
      return repoInfo
