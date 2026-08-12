ScientificActionRegistry <- setRefClass(
  "ScientificActionRegistry",
  fields = list(handlers = "list"),
  methods = list(
    initialize = function(action_handlers) {
      registry <- list()
      for (handler in action_handlers) {
        if (!is.null(registry[[handler$action]])) {
          stop(
            sprintf("Duplicate R scientific action handler: %s", handler$action),
            call. = FALSE
          )
        }
        registry[[handler$action]] <- handler
      }
      handlers <<- registry
      callSuper()
    },
    run = function(payload, request_id) {
      action <- as.character(payload$action)
      handler <- handlers[[action]]
      if (is.null(handler)) {
        stop(
          sprintf("Unsupported R scientific action: %s", action),
          call. = FALSE
        )
      }
      handler$run(payload, request_id)
    }
  )
)
