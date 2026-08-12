WorkerProtocol <- setRefClass(
  "WorkerProtocol",
  methods = list(
    emit = function(message) {
      cat(
        jsonlite::toJSON(
          message,
          auto_unbox = TRUE,
          null = "null",
          digits = NA
        ),
        "\n",
        sep = ""
      )
      flush(stdout())
    },
    progress = function(request_id, value, detail) {
      emit(list(
        id = request_id,
        type = "progress",
        progress = max(0, min(1, value)),
        detail = detail
      ))
    }
  )
)
