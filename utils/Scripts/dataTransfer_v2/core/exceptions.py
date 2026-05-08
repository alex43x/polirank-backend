class DataTransferError(Exception):
    """Base exception for DataTransfer logic."""
    pass

class DuplicateDocenteError(DataTransferError):
    pass

class ConfigError(DataTransferError):
    """Error in mapping or settings."""
    pass

class DatabaseConnectionError(DataTransferError):
    pass
