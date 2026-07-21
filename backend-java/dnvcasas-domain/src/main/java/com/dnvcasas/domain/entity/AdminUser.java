package com.dnvcasas.domain.entity;

import jakarta.persistence.*;

/**
 * Usuario administrador: el único que puede entrar al panel y gestionar el catálogo.
 * No hay registro público; los admin se crean directamente en la base.
 *
 * Nunca guarda la contraseña en texto plano, solo su hash (ver passwordHash).
 */
@Entity
@Table(name = "AdminUsers")
public class AdminUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private int id;

    @Column(name = "Email", length = 255, nullable = false, unique = true)
    private String email = "";

    // Hash de la contraseña (BCrypt), NO la contraseña. La verificación del login
    // compara el hash; el texto plano nunca se guarda ni se loguea.
    @Column(name = "PasswordHash", length = 100, nullable = false)
    private String passwordHash = "";

    public int getId()             { return id; }
    public String getEmail()       { return email; }
    public String getPasswordHash(){ return passwordHash; }

    public void setEmail(String email)          { this.email = email; }
    public void setPasswordHash(String hash)    { this.passwordHash = hash; }
}
