-- Actualiza contraseñas (bcrypt). Contraseñas en claro: credenciales-evento.private.md
-- Una sola sentencia: pegar/ejecutar TODO el archivo, no línea por línea.

UPDATE user_account AS u
SET password_hash = s.password_hash
FROM (
    VALUES
        ('admin', '$2b$10$SLNSdMb6Vtp/q/E5vw8gc.1AQrl13nELUA.mV2hAcqnzNeVzUq0u6'),
        ('dev', '$2b$10$fGnmXZSZ5yfbgdXQEzsg2.xL7XwSDQqISDqpP88p7ns9c9qZ0d7O6'),
        ('visitante', '$2b$10$DBILz6gKc/wSjkffkw/2AuBo.bpwl7fDUa1uIdXYCwqdcJrTtsjiW'),
        ('guillermo.iglesias', '$2b$10$uuQMcINfGGPQ09/jJuV42.LAIVuPrX0PRab/IGUTjFAuV5urODyW2'),
        ('jesus.hernandez', '$2b$10$SeqYsoX4nz4/FzTWRDxWpON759dEurKaW2trhufqtPxdY6LAZKI1e'),
        ('alejandra.gonzales', '$2b$10$rPkb6WNcVbBwOXrqT4x3aO327rK1ZkxHXJ/mcj8MP7nXh1KOjBLrW'),
        ('martha.sanchez', '$2b$10$wrorlrQpWN6tCVE2k.PmL.P/l15PbqUnytPi4KPjLI5ZmEttiXagK'),
        ('raul.uranga', '$2b$10$xb5DhaXCIY8fK2xaDcHW1uQWVzQ5WUDTBbHWDsoLMFCSey2x/Hoy2'),
        ('rogelio.galvan', '$2b$10$HJ6ModUrjNILeCOKvd51AOJs3BSWGqn.mmE4mDBOWtNBE1VVa7Joa'),
        ('rosendo.deluna', '$2b$10$upaqqajpYBQypazCG9rBGe/.lGSdwTQSbqmS0rmow1eHE0Qsq64wC'),
        ('estela.salas', '$2b$10$4/x43JpTWETT5KcbeqSbwuY3yiMMZTXbnANDwOoCsOLr8Hhcss/RW'),
        ('juan.serrano', '$2b$10$cyzY/BuId/501Owq9Vooj.kc5RZ0sapG8xvHQbn4m4dCV99XOEdOC'),
        ('manuel.zertuche', '$2b$10$sBEsISh3LmcOYKLqV8L71uYcJeZL0FZ/ZU9yFCEpELCcdIgkv.Brq'),
        ('ximena.silva', '$2b$10$j6FqoiwdRPo6GEU2RNdSu.D29XzlgFJwG3zaYYeaOj04ZwLoi3cRG'),
        ('felix.macias', '$2b$10$QbKNGZzzCdBPIIWMVlhI0OTQ35vn7WkutpLzrVSgqzXvo.JVjhXma'),
        ('teamregistro', '$2b$10$IbfhtowlfDGlTmp/cZxX/u.4MrE7lYi/AZJEOhOyqY2CBLnJo0IOa')
) AS s(username, password_hash)
WHERE u.username = s.username;
